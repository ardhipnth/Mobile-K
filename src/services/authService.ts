/**
 * authService.ts — REST API calls ke Supabase Auth
 *
 * Semua komunikasi jaringan terkait autentikasi terpusat di sini.
 * Tidak ada secret yang di-hardcode; URL & key dibaca dari constants/api.ts
 * yang membacanya dari process.env (EXPO_PUBLIC_*).
 *
 * Endpoint yang digunakan:
 *  - Login  : POST {SUPABASE_URL}/auth/v1/token?grant_type=password
 *  - Signup : POST {SUPABASE_URL}/auth/v1/signup
 */

import { SUPABASE_URL, SUPABASE_KEY } from '@/constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  nim: string;
}

export interface LoginPayload {
  accessToken: string;
  user: AuthUser;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Header standar untuk setiap request ke Supabase Auth REST API */
function buildHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
  };
}

/**
 * Menerjemahkan HTTP status yang dikenal menjadi pesan error yang ramah pengguna.
 * Body JSON dari Supabase juga diparse untuk mendapatkan pesan lebih spesifik.
 */
async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    // Supabase mengirim { error_description: '...' } atau { msg: '...' } atau { message: '...' }
    const detail: string =
      body?.error_description ?? body?.msg ?? body?.message ?? '';

    if (res.status === 400) {
      // Tangani pesan spesifik Supabase
      if (detail.toLowerCase().includes('invalid login')) {
        return 'Email atau password salah. Periksa kembali dan coba lagi.';
      }
      if (detail.toLowerCase().includes('email not confirmed')) {
        return 'Email belum dikonfirmasi. Cek inbox email kamu.';
      }
      if (detail.toLowerCase().includes('user already registered')) {
        return 'Email sudah terdaftar. Silakan login atau gunakan email lain.';
      }
      return detail || 'Email atau password salah.';
    }
    if (res.status === 422) {
      return detail || 'Data yang dikirim tidak valid.';
    }
    if (res.status === 429) {
      return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
    }
    return detail || `Terjadi kesalahan (HTTP ${res.status}). Coba lagi.`;
  } catch {
    return `Terjadi kesalahan (HTTP ${res.status}). Coba lagi.`;
  }
}

// ─── Validasi Input ───────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationError {
  field: string;
  message: string;
}

/** Validasi field login sebelum request dikirim */
export function validateLoginInput(
  email: string,
  password: string,
): ValidationError | null {
  if (!email.trim()) return { field: 'email', message: 'Email wajib diisi.' };
  if (!EMAIL_REGEX.test(email.trim()))
    return { field: 'email', message: 'Format email tidak valid.' };
  if (!password) return { field: 'password', message: 'Password wajib diisi.' };
  if (password.length < 8)
    return { field: 'password', message: 'Password minimal 8 karakter.' };
  return null;
}

/** Validasi field register sebelum request dikirim */
export function validateRegisterInput(
  name: string,
  nim: string,
  email: string,
  password: string,
  confirmPassword: string,
): ValidationError | null {
  if (!name.trim())
    return { field: 'name', message: 'Nama lengkap wajib diisi.' };
  if (name.trim().length < 3)
    return { field: 'name', message: 'Nama lengkap minimal 3 karakter.' };
  if (!nim.trim()) return { field: 'nim', message: 'NIM wajib diisi.' };
  if (!/^\d+$/.test(nim))
    return { field: 'nim', message: 'NIM hanya boleh berisi angka.' };
  if (nim.length < 6)
    return { field: 'nim', message: 'NIM minimal 6 digit.' };
  if (!email.trim()) return { field: 'email', message: 'Email wajib diisi.' };
  if (!EMAIL_REGEX.test(email.trim()))
    return {
      field: 'email',
      message: 'Format email tidak valid. Contoh: nama@kampus.ac.id',
    };
  if (!password)
    return { field: 'password', message: 'Password wajib diisi.' };
  if (password.length < 8)
    return { field: 'password', message: 'Password minimal 8 karakter.' };
  if (!confirmPassword)
    return {
      field: 'confirmPassword',
      message: 'Konfirmasi password wajib diisi.',
    };
  if (password !== confirmPassword)
    return {
      field: 'confirmPassword',
      message: 'Konfirmasi password tidak cocok dengan password.',
    };
  return null;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Login via Supabase Auth REST API.
 *
 * POST {SUPABASE_URL}/auth/v1/token?grant_type=password
 * Body: { email, password }
 *
 * Mengembalikan { accessToken, user } bila berhasil.
 * Melempar Error dengan pesan ramah pengguna bila gagal.
 */
export async function login(
  email: string,
  password: string,
): Promise<LoginPayload> {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    },
  );

  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new Error(message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();

  const user: AuthUser = {
    id: data.user?.id ?? '',
    email: data.user?.email ?? email.trim().toLowerCase(),
    name: data.user?.user_metadata?.name ?? '',
    nim: data.user?.user_metadata?.nim ?? '',
  };

  return { accessToken: data.access_token as string, user };
}

/**
 * Registrasi akun baru via Supabase Auth REST API, lalu langsung login.
 *
 * POST {SUPABASE_URL}/auth/v1/signup
 * Body: { email, password, data: { name, nim } }
 *
 * Setelah signup berhasil, memanggil login() untuk mendapatkan token.
 * Melempar Error dengan pesan ramah pengguna bila gagal.
 */
export async function register(
  name: string,
  nim: string,
  email: string,
  password: string,
): Promise<LoginPayload> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      data: { name: name.trim(), nim },
    }),
  });

  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new Error(message);
  }

  // Signup berhasil — langsung login untuk mendapatkan access token
  return login(email, password);
}
