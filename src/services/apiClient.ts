/**
 * apiClient.ts — Client HTTP terautentikasi untuk Supabase REST API
 *
 * Mengirim request ke endpoint Supabase dengan menyertakan:
 *  - Header `apikey`: SUPABASE_KEY
 *  - Header `Authorization`: Bearer ${token} (diambil dari SecureStore)
 *  - Header `Content-Type`: application/json
 *
<<<<<<< Updated upstream
 * Menangani respon 401 Unauthorized secara terpusat:
 *  - Menghapus token dari SecureStore
 *  - Memicu event unauthorized agar state login berubah menjadi tidak terautentikasi
 *  - Melempar error ramah pengguna
=======
 * Menangani semua kemungkinan kegagalan request secara terpusat:
 *  - Timeout (> 15 detik)        → ApiError kind 'timeout'
 *  - Error jaringan (offline)    → ApiError kind 'network'
 *  - HTTP 401 Unauthorized       → logout otomatis + ApiError kind 'unauthorized'
 *  - HTTP 4xx/5xx lainnya        → ApiError kind 'http' dengan pesan per status
>>>>>>> Stashed changes
 *
 * PENTING: Jangan pernah mencetak access token ke console!
 */

import { SUPABASE_URL, SUPABASE_KEY } from '@/constants/api';
import { getAccessToken, deleteAccessToken } from '@/utils/secureStore';

// ─── Event Listener Sesi Unauthorized (401) ──────────────────────────────────

type UnauthorizedListener = () => void | Promise<void>;

const unauthorizedListeners = new Set<UnauthorizedListener>();

/**
 * Mendaftarkan callback ketika terjadi respon 401 Unauthorized (sesi berakhir/invalid).
 * Mengembalikan fungsi unsubscribe untuk melepas listener.
 */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

/**
 * Menjalankan seluruh listener yang terdaftar ketika request mendapatkan status 401.
 */
export async function notifyUnauthorized(): Promise<void> {
  const promises: Array<void | Promise<void>> = [];
  unauthorizedListeners.forEach((listener) => {
    try {
      promises.push(listener());
    } catch (err) {
      console.error('[apiClient] Error pada unauthorized listener:', err);
    }
  });
  await Promise.all(promises);
}

// ─── Konstanta ───────────────────────────────────────────────────────────────

/**
 * Batas waktu maksimum setiap request HTTP (dalam milidetik).
 * Bila server tidak merespons dalam waktu ini, request dibatalkan
 * dan ApiError kind 'timeout' dilempar.
 */
const REQUEST_TIMEOUT_MS = 15_000;

// ─── authFetch ────────────────────────────────────────────────────────────────

/**
 * Melakukan HTTP request terautentikasi ke Supabase REST API.
 * Mengambil token dari SecureStore (key "access_token") dan menyematkannya
 * ke header Authorization.
 *
<<<<<<< Updated upstream
=======
 * Alur penanganan error:
 *  1. Bila fetch() tidak selesai dalam REQUEST_TIMEOUT_MS (15 detik) →
 *       batalkan request via AbortController + lempar ApiError kind 'timeout'
 *  2. Bila fetch() sendiri gagal (tidak ada internet, DNS gagal, dsb.) →
 *       lempar ApiError kind 'network'
 *  3. Bila server membalas 401 →
 *       hapus token + notifikasi listener + lempar ApiError kind 'unauthorized'
 *  4. Bila response.ok === false (4xx/5xx selain 401) →
 *       lempar ApiError kind 'http' dengan pesan sesuai status
 *  5. Bila response.ok === true → kembalikan Response ke pemanggil
 *
>>>>>>> Stashed changes
 * @param path Endpoint path, misalnya '/rest/v1/products?select=*&order=id'
 * @param options Opsi RequestInit standar (method, body, custom headers, dll.)
 * @returns Promise<Response> dari fetch
 * @throws Error 'Belum login' jika token tidak ada di SecureStore
<<<<<<< Updated upstream
 * @throws Error 'Sesi berakhir, silakan login lagi' jika server mengembalikan HTTP 401
=======
 * @throws ApiError kind 'timeout' jika server tidak merespons dalam 15 detik
 * @throws ApiError kind 'network' jika tidak ada koneksi internet
 * @throws ApiError kind 'unauthorized' jika server mengembalikan HTTP 401
 * @throws ApiError kind 'http' jika server mengembalikan HTTP 4xx/5xx lainnya
>>>>>>> Stashed changes
 */
export async function authFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  // 1. Ambil token dari SecureStore (key "access_token")
  const token = await getAccessToken();

  // 2. Bila token tidak ada, lempar Error "Belum login"
  if (!token || !token.trim()) {
    throw new Error('Belum login');
  }

  // 3. Normalisasi path dan URL: ${SUPABASE_URL}${path}
  const baseUrl = SUPABASE_URL.endsWith('/')
    ? SUPABASE_URL.slice(0, -1)
    : SUPABASE_URL;
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${endpoint}`;

  // 4. Susun header: apikey, Authorization, dan Content-Type
  const customHeaders: Record<string, string> = {};
  if (options?.headers) {
    if (typeof (options.headers as any).forEach === 'function') {
      (options.headers as any).forEach((value: string, key: string) => {
        customHeaders[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        customHeaders[key] = value;
      });
    } else if (typeof options.headers === 'object') {
      Object.assign(customHeaders, options.headers);
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token}`,
    ...customHeaders,
  };

<<<<<<< Updated upstream
  // 5. Kirim HTTP request ke server (tanpa logging token ke console)
  const response = await fetch(url, {
    ...options,
    headers,
  });
=======
  // 5. Kirim HTTP request ke server dengan batas waktu REQUEST_TIMEOUT_MS.
  //    AbortController digunakan agar fetch dapat dibatalkan bila timeout.
  //    Bungkus dengan try/catch untuk menangkap:
  //      - AbortError  → timeout terlewati → ApiError kind 'timeout'
  //      - TypeError   → tidak ada internet / DNS gagal → ApiError kind 'network'
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (fetchErr) {
    // Selalu bersihkan timer terlebih dahulu
    clearTimeout(timeoutId);

    // AbortError terjadi ketika AbortController.abort() dipanggil (timeout)
    if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
      throw new ApiError(
        'timeout',
        'Waktu habis. Server terlalu lama merespons.'
      );
    }

    // Kegagalan lain (tidak ada koneksi, DNS gagal, dll.) → error jaringan
    throw new ApiError(
      'network',
      'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.'
    );
  }
>>>>>>> Stashed changes

  // Request selesai sebelum timeout — hentikan timer
  clearTimeout(timeoutId);

  // 6. Penanganan status 401 Unauthorized:
  //    - Hapus token dari SecureStore
  //    - Ubah state login menjadi tidak terautentikasi via listener
  //    - Lempar error ramah pengguna
  if (response.status === 401) {
    await deleteAccessToken();
    await notifyUnauthorized();
    throw new Error('Sesi berakhir, silakan login lagi');
  }

  return response;
}
