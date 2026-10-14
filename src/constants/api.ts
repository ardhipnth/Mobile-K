export const API_BASE_URL = 'https://6acf02b9f338359cf1c3e065.mockapi.io/api/v1';

/**
 * Supabase Auth REST API
 * Nilai dibaca dari environment variables — JANGAN hardcode secret di sini.
 * Isi EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_KEY di file .env (tidak di-commit).
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';
