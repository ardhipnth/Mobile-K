import { authFetch } from '@/services/apiClient';
import { Product, ProductDTO, mapProduct } from '@/types/product';

/**
 * Mengambil daftar produk dari REST API Supabase (PostgREST).
 * Menggunakan authFetch sehingga request otomatis menyertakan access token (JWT)
 * pada header Authorization.
 *
 * Penanganan error sepenuhnya didelegasikan ke authFetch (ApiError):
 *  - Error jaringan  → ApiError kind 'network'   (authFetch melempar, diteruskan ke sini)
 *  - HTTP 401        → ApiError kind 'unauthorized' (authFetch memicu logout lalu melempar)
 *  - HTTP 4xx/5xx    → ApiError kind 'http'       (authFetch melempar, diteruskan ke sini)
 * Bila authFetch tidak melempar, response dijamin ok — tidak perlu cek response.ok di sini.
 *
 * @returns Promise<Product[]> Daftar produk yang sudah dipetakan untuk UI
 * @throws ApiError bila request gagal (diteruskan dari authFetch tanpa modifikasi)
 * @throws Error 'Belum login' jika token tidak ada di SecureStore
 */
export async function getProducts(): Promise<Product[]> {
  // 1. Request: authFetch melempar ApiError bila ada kegagalan jaringan/HTTP
  const response = await authFetch('/rest/v1/products?select=*&order=id');

  // 2. Parse JSON: response dijamin ok karena authFetch sudah memeriksa response.ok
  const data: ProductDTO[] = await response.json();

  // 3. Mapping: Memetakan setiap item dengan mapProduct dan memastikan setiap Product punya id string unik
  return data.map((item: ProductDTO, index: number): Product => {
    const product = mapProduct(item);
    const hasValidId =
      product.id !== undefined &&
      product.id !== null &&
      String(product.id).trim() !== '';

    return {
      ...product,
      // Bila id dari API kosong, gunakan indeks sebagai cadangan
      id: hasValidId ? String(product.id) : String(index),
    };
  });
}
