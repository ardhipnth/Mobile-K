/**
 * product.ts - Definisi tipe data dan mapping untuk entitas Produk
 *
 * Mengapa memisahkan DTO (Data Transfer Object) dari model data UI (Product)?
 * 1. Decoupling: Jika suatu saat API mengubah nama field (misal `seller_name` menjadi `vendor_name`),
 *    kita hanya perlu mengubah fungsi `mapProduct`, tanpa perlu mengubah seluruh komponen UI.
 * 2. Konsistensi UI: UI menggunakan penamaan camelCase standar TypeScript, sedangkan API mungkin
 *    menggunakan snake_case standar database.
 * 3. Filtrasi Data: API mungkin mengembalikan data ekstra (seperti `created_at`, `updated_at`,
 *    `deleted_at`) yang tidak relevan untuk dirender di UI. Kita bisa membuangnya di mapping layer.
 * 4. Konversi Tipe: Kadang API mengembalikan angka dalam bentuk string (misal `"150000"`). 
 *    Mapping layer memastikan tipe datanya benar saat masuk ke komponen (menjadi `number`).
 */

/**
 * ProductDTO: Bentuk data mentah (raw data) yang diterima dari response API.
 * Menggunakan penamaan snake_case sesuai dengan standar response JSON dari backend.
 */
export interface ProductDTO {
  /** ID unik produk dari database (string atau number) */
  id: string | number;
  
  /** Nama/judul produk */
  title: string;
  
  /** Harga produk (bisa berupa string/number dari API, kita definisikan string untuk simulasi konversi) */
  price: string | number;
  
  /** Kategori fakultas */
  faculty_name: string;
  
  /** Kondisi barang (misal: "Baru", "Bekas 90%") */
  condition_desc: string;
  
  /** Lokasi COD/pertemuan */
  cod_location: string;
  
  /** URL gambar utama produk */
  image_url: string;
  
  /** Nama penjual */
  seller_name: string;
  
  /** Status apakah penjual sudah terverifikasi NIM-nya */
  is_nim_verified: boolean;
  
  /** Waktu produk dibuat di database (Extra field: tidak dipakai UI) */
  created_at?: string;
  
  /** Waktu produk terakhir diubah di database (Extra field: tidak dipakai UI) */
  updated_at?: string;
}

/**
 * Product: Bentuk data yang digunakan oleh aplikasi (UI).
 * Field-field di bawah ini HARUS sama dengan yang dibutuhkan oleh
 * komponen ProductCard dan DUMMY_PRODUCTS agar tidak ada komponen yang pecah.
 */
export interface Product {
  /** ID unik produk */
  id: string;
  
  /** Nama/judul produk */
  title: string;
  
  /** Harga dalam bentuk angka (number) */
  price: number;
  
  /** Kategori fakultas */
  faculty: string;
  
  /** Kondisi barang */
  condition: string;
  
  /** Lokasi COD */
  location: string;
  
  /** URL gambar */
  imageUrl: string;
  
  /** Nama penjual */
  sellerName: string;
  
  /** Status verifikasi NIM */
  isNIMVerified?: boolean;
}

/**
 * Fungsi untuk memetakan data DTO dari API menjadi data Product untuk UI.
 * Melakukan konversi tipe data dan perubahan nama properti.
 * 
 * @param dto Data mentah dari API
 * @returns Data yang sudah siap dipakai oleh UI
 */
export function mapProduct(dto: ProductDTO): Product {
  const parsedPrice = typeof dto.price === 'string' ? parseFloat(dto.price) : dto.price;
  const validPrice = isNaN(parsedPrice) ? 0 : parsedPrice;

  return {
    id: String(dto.id),
    title: dto.title,
    // Pastikan harga selalu number valid (jika NaN maka set ke 0)
    price: validPrice,
    // Mapping nama field dari API (snake_case) ke UI (camelCase)
    faculty: dto.faculty_name,
    condition: dto.condition_desc,
    location: dto.cod_location,
    imageUrl: dto.image_url,
    sellerName: dto.seller_name,
    isNIMVerified: dto.is_nim_verified,
    // Field ekstra seperti created_at dan updated_at diabaikan / tidak dimasukkan ke object akhir
  };
}
