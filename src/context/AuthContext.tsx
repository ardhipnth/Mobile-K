/**
 * AuthContext — Manajemen state autentikasi KampusMarket
 *
 * Arsitektur Penyimpanan (Sprint 03+):
 *  1. expo-secure-store (Hardware-backed Encrypted Storage: iOS Keychain / Android KeyStore):
 *     - Menyimpan Supabase JWT access_token dengan key "access_token".
 *     - Menyimpan data profil user (JSON) dengan key "km_user_data".
 *     - saveAccessToken  → dipanggil saat login & register berhasil.
 *     - getAccessToken   → dipanggil saat aplikasi dibuka untuk memulihkan sesi.
 *     - deleteAccessToken→ dipanggil saat pengguna logout.
 *     - saveUserData     → dipanggil saat login & register berhasil.
 *     - getUserData      → dipanggil saat memulihkan sesi agar nama/email tampil.
 *     - deleteUserData   → dipanggil saat logout.
 *
 *  Apa yang TIDAK disimpan:
 *  - Tidak ada password atau secret apapun selain JWT dari server.
 *  - Token TIDAK pernah dicetak ke console.
 *
 * Alur Login:
 *  Form → validate() → authService.login() → Supabase REST API
 *  → access_token → saveAccessToken + saveUserData (SecureStore)
 *  → setState(isAuthenticated: true)
 *
 * Alur Restore Session:
 *  App dibuka → getAccessToken + getUserData (SecureStore)
 *  → token ada → setState(isAuthenticated: true, user: <data tersimpan>)
 *  → token tidak ada → setState(isAuthenticated: false, isLoading: false)
 *
 * Penanganan 401:
 *  apiClient mendapat 401 → notifyUnauthorized() → logout() otomatis
 *  → Alert "Sesi berakhir, silakan login lagi" → navigasi ke halaman login
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  saveAccessToken,
  getAccessToken,
  deleteAccessToken,
  saveUserData,
  getUserData,
  deleteUserData,
} from '@/utils/secureStore';
import * as authService from '@/services/authService';
import type { AuthUser } from '@/services/authService';
import { onUnauthorized } from '@/services/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  nim: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export type LoginResult =
  | { success: true; user: User; token: string }
  | { success: false; error: string };

export type RegisterResult =
  | { success: true; user: User; token: string }
  | { success: false; error: string };

export interface RegisterParams {
  name: string;
  nim: string;
  email: string;
  password: string;
}

interface AuthContextValue extends AuthState {
  /**
   * Login menggunakan email dan password.
   * Validasi lokal dilakukan di authService.validateLoginInput().
   */
  login: (email: string, password: string) => Promise<LoginResult>;
  /**
   * Registrasi akun baru. Setelah berhasil, langsung login otomatis.
   * Validasi lokal dilakukan di authService.validateRegisterInput().
   */
  register: (params: RegisterParams) => Promise<RegisterResult>;
  /** Hapus token dari SecureStore dan reset state ke unauthenticated */
  logout: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapAuthUser(authUser: AuthUser): User {
  return {
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    nim: authUser.nim,
  };
}

// Referensi global ke fungsi navigasi, di-set dari dalam AuthProvider
// setelah router tersedia. Dipakai oleh handler 401 yang terpicu dari
// luar render cycle React (via onUnauthorized callback).
let _navigateToLogin: (() => void) | null = null;

export function setNavigateToLoginRef(fn: () => void): void {
  _navigateToLogin = fn;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const router = useRouter();

  // Simpan referensi router agar selalu segar di dalam closures.
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });

  // Daftarkan fungsi navigasi ke login ke referensi global saat mount.
  useEffect(() => {
    setNavigateToLoginRef(() => {
      routerRef.current.replace('/(auth)/login' as any);
    });
    return () => {
      _navigateToLogin = null;
    };
  }, []);

  // ─── Restore Session saat Aplikasi Dibuka ──────────────────────────────────
  //
  // Membaca token DAN data user dari SecureStore sehingga nama & email
  // langsung tersedia tanpa round-trip ke server.
  // Token divalidasi server saat request pertama yang memerlukan otorisasi.
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        // Baca JWT dari iOS Keychain / Android KeyStore
        const token = await getAccessToken();

        if (token && isMounted) {
          // Baca data user yang disimpan saat login sebelumnya
          const stored = await getUserData();
          setState({
            user: stored
              ? {
                  id: stored.id,
                  name: stored.name,
                  email: stored.email,
                  nim: stored.nim,
                }
              : null,
            token,
            isLoading: false,
            isAuthenticated: true,
          });
          return;
        }
      } catch (error) {
        console.error('[AuthContext] Gagal memulihkan sesi:', error);
      }

      if (isMounted) {
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      // 1. Validasi input lokal sebelum request dikirim
      const validationError = authService.validateLoginInput(email, password);
      if (validationError) {
        return { success: false, error: validationError.message };
      }

      try {
        // 2. POST ke Supabase Auth REST API
        const payload = await authService.login(email, password);

        // 3. Simpan JWT ke SecureStore (setItemAsync)
        await saveAccessToken(payload.accessToken);

        const user = mapAuthUser(payload.user);

        // 4. Simpan data user ke SecureStore agar tetap tersedia setelah restart
        await saveUserData(user);

        // 5. Update state
        setState({
          user,
          token: payload.accessToken,
          isLoading: false,
          isAuthenticated: true,
        });

        return { success: true, user, token: payload.accessToken };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan jaringan. Coba lagi.';
        return { success: false, error: message };
      }
    },
    [],
  );

  // ─── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(
    async (params: RegisterParams): Promise<RegisterResult> => {
      const { name, nim, email, password } = params;

      // 1. Validasi input lokal sebelum request dikirim
      const validationError = authService.validateRegisterInput(
        name,
        nim,
        email,
        password,
        password, // halaman sudah validasi confirmPassword sebelum memanggil ini
      );
      if (validationError) {
        return { success: false, error: validationError.message };
      }

      try {
        // 2. POST signup ke Supabase, lalu authService otomatis login()
        const payload = await authService.register(name, nim, email, password);

        // 3. Simpan JWT ke SecureStore (setItemAsync)
        await saveAccessToken(payload.accessToken);

        const user = mapAuthUser(payload.user);

        // 4. Simpan data user ke SecureStore agar tetap tersedia setelah restart
        await saveUserData(user);

        // 5. Update state
        setState({
          user,
          token: payload.accessToken,
          isLoading: false,
          isAuthenticated: true,
        });

        return { success: true, user, token: payload.accessToken };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan jaringan. Coba lagi.';
        return { success: false, error: message };
      }
    },
    [],
  );

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      // Hapus JWT dari iOS Keychain / Android KeyStore
      await deleteAccessToken();
      // Hapus data profil user dari SecureStore
      await deleteUserData();
    } catch (error) {
      console.error('[AuthContext] Gagal logout:', error);
    } finally {
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  // ─── Tangani Sesi Berakhir (401 dari apiClient) ─────────────────────────────
  //
  // Ketika apiClient mendapat respon 401 (token kedaluwarsa/tidak valid),
  // logout() otomatis dipanggil, lalu ditampilkan Alert kepada user,
  // dan setelah OK ditekan navigasi ke halaman login dilakukan.
  useEffect(() => {
    const unsubscribe = onUnauthorized(async () => {
      await logout();
      Alert.alert(
        'Sesi Berakhir',
        'Sesi berakhir, silakan login lagi.',
        [
          {
            text: 'OK',
            onPress: () => {
              _navigateToLogin?.();
            },
          },
        ],
        { cancelable: false },
      );
    });
    return unsubscribe;
  }, [logout]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  }
  return ctx;
}
