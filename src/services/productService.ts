import { API_BASE_URL } from '@/constants/api';
import { Product, ProductDTO, mapProduct } from '@/types/product';

/**
 * Mengambil daftar produk dari REST API.
 * 
 * @returns Promise<Product[]> Daftar produk yang sudah dipetakan untuk UI
 */
export async function getProducts(): Promise<Product[]> {
  try {
    // 1. Request: Melakukan GET ke ${API_BASE_URL}/products
    const response = await fetch(`${API_BASE_URL}/products`);

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
    // Jika error adalah error response HTTP yang sudah kita buat (berisi status code), lempar kembali
    if (error instanceof Error && error.message.includes('Status code:')) {
      throw error;
    }

    // Menangkap error jaringan (misalnya tidak ada internet) dan melemparkannya ulang dengan pesan yang mudah dipahami pengguna
    throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.');
  }
}
