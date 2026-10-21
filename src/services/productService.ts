import { authFetch } from '@/services/apiClient';
import { Product, ProductDTO, mapProduct } from '@/types/product';

/**
 * Mengambil daftar produk dari REST API Supabase (PostgREST).
 * Menggunakan authFetch sehingga request otomatis menyertakan access token (JWT)
 * pada header Authorization.
 * 
 * @returns Promise<Product[]> Daftar produk yang sudah dipetakan untuk UI
 */
export async function getProducts(): Promise<Product[]> {
  try {
    // 1. Request: Melakukan GET terautentikasi ke PostgREST Supabase
    const response = await authFetch('/rest/v1/products?select=*&order=id');

    // 2. Response: Memeriksa response.ok, dan bila gagal lempar Error dengan pesan jelas (sertakan status code)
    if (!response.ok) {
      throw new Error(`Gagal mengambil data produk dari server. Status code: ${response.status}`);
    }

    // 3. Parse JSON: Memanggil response.json() untuk mengekstrak data
    const data: ProductDTO[] = await response.json();

    // 4. Mapping: Memetakan setiap item dengan mapProduct dan memastikan setiap Product punya id string unik
    return data.map((item: ProductDTO, index: number): Product => {
      const product = mapProduct(item);
      const hasValidId = product.id !== undefined && product.id !== null && String(product.id).trim() !== '';

      return {
        ...product,
        // Bila id dari API kosong, gunakan indeks sebagai cadangan
        id: hasValidId ? String(product.id) : String(index),
      };
    });
  } catch (error) {
    // Teruskan error dari authFetch ("Belum login", "Sesi berakhir...") atau status code HTTP
    if (error instanceof Error) {
      if (
        error.message === 'Belum login' ||
        error.message.includes('Sesi berakhir') ||
        error.message.includes('Status code:')
      ) {
        throw error;
      }

      // Menangkap error jaringan (misalnya offline)
      if (error.name === 'TypeError' || error.message.toLowerCase().includes('network')) {
        throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.');
      }

      throw error;
    }

    // Menangkap error jaringan atau error tak terduga lainnya
    throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.');
  }
}

