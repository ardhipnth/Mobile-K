/**
 * AuthContext — Manajemen state autentikasi KampusMarket
 *
 * Arsitektur Penyimpanan:
 *  1. expo-secure-store (Hardware-backed Encrypted Storage: iOS Keychain / Android KeyStore):
 *     - Digunakan untuk data sensitif: Token Sesi Otentikasi (km_session_token).
 *     - setItemAsync  -> Dipanggil saat login & registrasi berhasil.
 *     - getItemAsync  -> Dipanggil saat aplikasi dibuka untuk memvalidasi sesi aktif.
 *     - deleteItemAsync -> Dipanggil saat pengguna logout untuk memusnahkan kredensial sesi.
 *
 *  2. AsyncStorage (Standard Unencrypted Storage):
 *     - Digunakan untuk data non-sensitif: Profil publik pengguna (nama, NIM, email),
 *       dan tabel mock pengguna (km_users).
 *
 *  3. Keamanan Kata Sandi:
 *     - Password TIDAK PERNAH disimpan sebagai plaintext di mana pun.
 *     - Hanya disimpan dalam bentuk one-way hash pada tabel mock lokal.
 *     - Nilai hash kata sandi tidak pernah disimpan dalam token sesi maupun objek profil aktif.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveSessionToken,
  getSessionToken,
  deleteSessionToken,
} from '@/utils/secureStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  nim: string;
  email: string;
  createdAt: string;
  /** Hash kata sandi — HANYA ada di tabel database mock km_users, TIDAK disimpan di sesi aktif */
  passwordHash?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (nim: string, password: string) => Promise<LoginResult>;
  register: (params: RegisterParams) => Promise<RegisterResult>;
  logout: () => Promise<void>;
}

export interface RegisterParams {
  name: string;
  nim: string;
  email: string;
  password: string;
}

export type LoginResult =
  | { success: true; user: User; token: string }
  | { success: false; error: string };

export type RegisterResult =
  | { success: true; user: User; token: string }
  | { success: false; error: string };

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  USERS_DB: 'km_users',
  SESSION_USER: 'km_session_user',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Hash satu arah untuk proteksi kata sandi offline.
 * Password asli TIDAK PERNAH disimpan dalam format plaintext.
 */
function simpleHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
    hash = hash & hash; // Konversi ke 32-bit signed integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Menghasilkan token sesi autentikasi unik.
 * Dalam sistem produksi nyata, token ini diterbitkan oleh backend berupa signed JWT.
 */
function generateSessionToken(userId: string): string {
  const timestamp = Date.now().toString(36);
  const entropy = Math.random().toString(36).substring(2, 10);
  return `km_sec_${userId}_${timestamp}_${entropy}`;
}

/** Menghilangkan properti hash password sebelum disimpan ke sesi atau diekspos */
function sanitizeUser(user: User): User {
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

async function getStoredUsers(): Promise<User[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

async function saveUsers(users: User[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
}

async function getStoredSessionUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_USER);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

async function saveSessionUser(user: User | null): Promise<void> {
  if (user) {
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(sanitizeUser(user)));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_USER);
  }
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

  // ─── Cek Sesi saat Aplikasi Dibuka (getItemAsync) ───────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        // Ambil token sesi terenkripsi via expo-secure-store (getItemAsync)
        const token = await getSessionToken();

        if (token) {
          // Ambil profil pengguna yang tersimpan di storage biasa
          const storedUser = await getStoredSessionUser();

          if (storedUser && isMounted) {
            setState({
              user: sanitizeUser(storedUser),
              token,
              isLoading: false,
              isAuthenticated: true,
            });
            return;
          }
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

  // ─── Registrasi Akun Baru ───────────────────────────────────────────────────
  const register = useCallback(
    async (params: RegisterParams): Promise<RegisterResult> => {
      const { name, nim, email, password } = params;

      const users = await getStoredUsers();

      // Cek duplikat NIM
      if (users.some((u) => u.nim === nim)) {
        return { success: false, error: 'NIM sudah terdaftar. Coba login.' };
      }

      // Cek duplikat email
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return {
          success: false,
          error: 'Email sudah digunakan. Coba login atau gunakan email lain.',
        };
      }

      // Password TIDAK PERNAH disimpan sebagai plaintext
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        nim,
        email: email.toLowerCase().trim(),
        passwordHash: simpleHash(password),
        createdAt: new Date().toISOString(),
      };

      await saveUsers([...users, newUser]);

      // Buat token sesi dan simpan ke SecureStore (setItemAsync)
      const token = generateSessionToken(newUser.id);
      await saveSessionToken(token);

      // Simpan metadata profil non-sensitif ke AsyncStorage biasa
      const cleanUser = sanitizeUser(newUser);
      await saveSessionUser(cleanUser);

      setState({
        user: cleanUser,
        token,
        isLoading: false,
        isAuthenticated: true,
      });

      return { success: true, user: cleanUser, token };
    },
    []
  );

  // ─── Login (setItemAsync) ───────────────────────────────────────────────────
  const login = useCallback(
    async (nim: string, password: string): Promise<LoginResult> => {
      const users = await getStoredUsers();

      const user = users.find((u) => u.nim === nim);
      if (!user) {
        return {
          success: false,
          error: 'NIM tidak ditemukan. Periksa NIM atau daftar akun baru.',
        };
      }

      // Verifikasi hash kata sandi (bukan plaintext comparison)
      if (user.passwordHash !== simpleHash(password)) {
        return { success: false, error: 'Password salah. Coba lagi.' };
      }

      // Buat token sesi dan simpan ke SecureStore (setItemAsync)
      const token = generateSessionToken(user.id);
      await saveSessionToken(token);

      // Simpan metadata profil non-sensitif ke AsyncStorage biasa
      const cleanUser = sanitizeUser(user);
      await saveSessionUser(cleanUser);

      setState({
        user: cleanUser,
        token,
        isLoading: false,
        isAuthenticated: true,
      });

      return { success: true, user: cleanUser, token };
    },
    []
  );

  // ─── Logout (deleteItemAsync) ──────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      // Hapus token sesi dari SecureStore (deleteItemAsync)
      await deleteSessionToken();

      // Bersihkan cache profil dari AsyncStorage biasa
      await saveSessionUser(null);
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
