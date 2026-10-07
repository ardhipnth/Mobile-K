/**
 * AuthContext — Manajemen state autentikasi KampusMarket
 *
 * Strategi penyimpanan lokal (pengganti backend sementara):
 *  - Daftar akun: AsyncStorage key "km_users" → JSON array of User
 *  - Sesi aktif : AsyncStorage key "km_session" → JSON User object
 *
 * Password TIDAK disimpan sebagai plaintext — hanya sebagai representasi
 * hash sederhana (SHA-like XOR fold) karena tidak ada backend crypto.
 * Untuk produksi: ganti dengan autentikasi server + JWT.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  nim: string;
  email: string;
  /** Password disimpan sebagai hash sederhana — BUKAN plaintext */
  passwordHash: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
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
  | { success: true; user: User }
  | { success: false; error: string };

export type RegisterResult =
  | { success: true; user: User }
  | { success: false; error: string };

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  USERS: 'km_users',
  SESSION: 'km_session',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Hash sederhana berbasis XOR fold + base-36. Digunakan hanya untuk penyimpanan
 * lokal offline. BUKAN pengganti bcrypt/argon2 di produksi.
 */
function simpleHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit int
  }
  return Math.abs(hash).toString(36);
}

async function getStoredUsers(): Promise<User[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

async function saveUsers(users: User[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

async function getStoredSession(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

async function saveSession(user: User | null): Promise<void> {
  if (user) {
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Restore session on app start
  useEffect(() => {
    (async () => {
      const session = await getStoredSession();
      setState({
        user: session,
        isLoading: false,
        isAuthenticated: session !== null,
      });
    })();
  }, []);

  // ─── Register ──────────────────────────────────────────────────────────────

  const register = useCallback(
    async (params: RegisterParams): Promise<RegisterResult> => {
      const { name, nim, email, password } = params;

      const users = await getStoredUsers();

      // Cek duplikat NIM
      if (users.some((u) => u.nim === nim)) {
        return { success: false, error: 'NIM sudah terdaftar. Coba login.' };
      }

      // Cek duplikat email (case-insensitive)
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return {
          success: false,
          error: 'Email sudah digunakan. Coba login atau gunakan email lain.',
        };
      }

      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        nim,
        email: email.toLowerCase().trim(),
        passwordHash: simpleHash(password),
        createdAt: new Date().toISOString(),
      };

      await saveUsers([...users, newUser]);
      await saveSession(newUser);

      setState({ user: newUser, isLoading: false, isAuthenticated: true });
      return { success: true, user: newUser };
    },
    []
  );

  // ─── Login ─────────────────────────────────────────────────────────────────

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

      if (user.passwordHash !== simpleHash(password)) {
        return { success: false, error: 'Password salah. Coba lagi.' };
      }

      await saveSession(user);
      setState({ user, isLoading: false, isAuthenticated: true });
      return { success: true, user };
    },
    []
  );

  // ─── Logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    await saveSession(null);
    setState({ user: null, isLoading: false, isAuthenticated: false });
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
