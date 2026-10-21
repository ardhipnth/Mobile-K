/**
 * apiClient.ts — Client HTTP terautentikasi untuk Supabase REST API
 *
 * Mengirim request ke endpoint Supabase dengan menyertakan:
 *  - Header `apikey`: SUPABASE_KEY
 *  - Header `Authorization`: Bearer ${token} (diambil dari SecureStore)
 *  - Header `Content-Type`: application/json
 *
 * Menangani respon 401 Unauthorized secara terpusat:
 *  - Menghapus token dari SecureStore
 *  - Memicu event unauthorized agar state login berubah menjadi tidak terautentikasi
 *  - Melempar error ramah pengguna
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

// ─── authFetch ────────────────────────────────────────────────────────────────

/**
 * Melakukan HTTP request terautentikasi ke Supabase REST API.
 * Mengambil token dari SecureStore (key "access_token") dan menyematkannya
 * ke header Authorization.
 *
 * @param path Endpoint path, misalnya '/rest/v1/products?select=*&order=id'
 * @param options Opsi RequestInit standar (method, body, custom headers, dll.)
 * @returns Promise<Response> dari fetch
 * @throws Error 'Belum login' jika token tidak ada di SecureStore
 * @throws Error 'Sesi berakhir, silakan login lagi' jika server mengembalikan HTTP 401
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
  const response = await fetch(url, {
    ...options,
    headers,
  });

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
