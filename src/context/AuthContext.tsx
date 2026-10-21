/**
 * AuthContext — Manajemen state autentikasi KampusMarket
 *
 * Arsitektur Penyimpanan (Sprint 03+):
 *  1. expo-secure-store (Hardware-backed Encrypted Storage: iOS Keychain / Android KeyStore):
 *     - Menyimpan Supabase JWT access_token dengan key "access_token".
 *     - saveAccessToken  → dipanggil saat login & register berhasil.
 *     - getAccessToken   → dipanggil saat aplikasi dibuka untuk memulihkan sesi.
 *     - deleteAccessToken→ dipanggil saat pengguna logout.
 *
 *  Apa yang TIDAK disimpan lagi:
 *  - Tidak ada tabel pengguna lokal (km_users) di AsyncStorage.
 *  - Tidak ada password hash (simpleHash) — validasi password dilakukan oleh Supabase.
 *  - Tidak ada token sesi mock lokal yang di-generate sendiri.
 *  - Tidak ada password atau secret apapun yang di-simpan lokal selain JWT dari server.
 *
 * Alur Login:
 *  Form → validate() → authService.login() → Supabase REST API
 *  → access_token → saveAccessToken (SecureStore) → setState(isAuthenticated: true)
 *
 * Alur Restore Session:
 *  App dibuka → getAccessToken (SecureStore) → token ada → setState(isAuthenticated: true)
 *  → token tidak ada → setState(isAuthenticated: false, isLoading: false)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  saveAccessToken,
  getAccessToken,
  deleteAccessToken,
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

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // ─── Restore Session saat Aplikasi Dibuka (getAccessToken) ─────────────────
  //
  // Hanya membaca token dari SecureStore untuk menentukan apakah sesi aktif.
  // Tidak ada round-trip ke server pada saat ini; token divalidasi saat request
  // berikutnya membutuhkan otorisasi (misalnya fetch data produk).
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        // getItemAsync — membaca JWT dari iOS Keychain / Android KeyStore
        const token = await getAccessToken();

        if (token && isMounted) {
          // Token ditemukan → sesi dianggap aktif
          // user di-set null dulu; layar yang membutuhkan data user
          // akan fetch ulang menggunakan token ini bila perlu.
          setState({
            user: null,
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

        // 4. Update state
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
        password, // register tidak memiliki confirmPassword di params; halaman sudah validasi sebelum memanggil ini
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

        // 4. Update state
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
      // deleteItemAsync — hapus JWT dari iOS Keychain / Android KeyStore
      await deleteAccessToken();
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
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      logout();
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
