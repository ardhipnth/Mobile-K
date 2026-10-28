/**
 * apiClient.ts — Client HTTP terautentikasi untuk Supabase REST API
 *
 * Mengirim request ke endpoint Supabase dengan menyertakan:
 *  - Header `apikey`: SUPABASE_KEY
 *  - Header `Authorization`: Bearer ${token} (diambil dari SecureStore)
 *  - Header `Content-Type`: application/json
 *
 * Menangani semua kemungkinan kegagalan request secara terpusat:
 *  - Error jaringan (offline)    → ApiError kind 'network'
 *  - HTTP 401 Unauthorized       → logout otomatis + ApiError kind 'unauthorized'
 *  - HTTP 4xx/5xx lainnya        → ApiError kind 'http' dengan pesan per status
 *
 * PENTING: Jangan pernah mencetak access token ke console!
 */

import { SUPABASE_URL, SUPABASE_KEY } from '@/constants/api';
import { getAccessToken, deleteAccessToken } from '@/utils/secureStore';
import { ApiError } from '@/utils/apiError';

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

// ─── authFetch ────────────────────────────────────────────────────────────────

/**
 * Mengembalikan pesan error ramah pengguna berdasarkan kode status HTTP.
 * Digunakan secara internal oleh authFetch.
 */
function httpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Permintaan tidak valid. Silakan coba lagi.';
    case 403:
      return 'Anda tidak punya akses ke halaman ini.';
    case 404:
      return 'Data tidak ditemukan.';
    case 500:
    case 502:
    case 503:
      return 'Terjadi kesalahan pada server. Silakan coba lagi.';
    default:
      return `Terjadi kesalahan pada request (kode ${status}). Silakan coba lagi.`;
  }
}

/**
 * Melakukan HTTP request terautentikasi ke Supabase REST API.
 * Mengambil token dari SecureStore (key "access_token") dan menyematkannya
 * ke header Authorization.
 *
 * Alur penanganan error:
 *  1. Bila fetch() sendiri gagal (tidak ada internet, DNS gagal, dsb.) →
 *       lempar ApiError kind 'network'
 *  2. Bila server membalas 401 →
 *       hapus token + notifikasi listener + lempar ApiError kind 'unauthorized'
 *  3. Bila response.ok === false (4xx/5xx selain 401) →
 *       lempar ApiError kind 'http' dengan pesan sesuai status
 *  4. Bila response.ok === true → kembalikan Response ke pemanggil
 *
 * @param path Endpoint path, misalnya '/rest/v1/products?select=*&order=id'
 * @param options Opsi RequestInit standar (method, body, custom headers, dll.)
 * @returns Promise<Response> dari fetch (hanya bila ok)
 * @throws Error 'Belum login' jika token tidak ada di SecureStore
 * @throws ApiError kind 'network' jika tidak ada koneksi internet
 * @throws ApiError kind 'unauthorized' jika server mengembalikan HTTP 401
 * @throws ApiError kind 'http' jika server mengembalikan HTTP 4xx/5xx lainnya
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

  // 5. Kirim HTTP request ke server (tanpa logging token ke console)
  //    Bungkus dengan try/catch untuk menangkap kegagalan jaringan:
  //    fetch() melempar TypeError bila tidak ada internet atau DNS gagal.
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    // Tidak ada response sama sekali → kegagalan di sisi jaringan
    throw new ApiError(
      'network',
      'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.'
    );
  }

  // 6. Penanganan status 401 Unauthorized:
  //    - Hapus token dari SecureStore
  //    - Ubah state login menjadi tidak terautentikasi via listener
  //    - Lempar ApiError kind 'unauthorized'
  if (response.status === 401) {
    await deleteAccessToken();
    await notifyUnauthorized();
    throw new ApiError(
      'unauthorized',
      'Sesi berakhir, silakan login lagi.',
      401
    );
  }

  // 7. Periksa response.ok: bila false, server membalas 4xx/5xx selain 401
  if (!response.ok) {
    throw new ApiError(
      'http',
      httpErrorMessage(response.status),
      response.status
    );
  }

  return response;
}
