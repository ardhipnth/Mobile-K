/**
 * wishlist.ts — Tipe data dan mapper untuk fitur Wishlist (ala marketplace)
 *
 * Skema tabel `wishlist` di Supabase:
 *   id, user_id (otomatis via RLS), product_id (bigint → products.id),
 *   note, is_bought, created_at
 *
 * WishlistItemDTO  : data mentah dari response API (dengan relasi products)
 * WishlistItem     : model UI (camelCase, siap dirender)
 * mapWishlistItem  : mapper DTO → UI
 */

import { ProductDTO } from '@/types/product';

// ─── DTO ──────────────────────────────────────────────────────────────────────

/**
 * Data mentah satu baris wishlist yang dikembalikan Supabase.
 * Kolom `products` adalah hasil JOIN/embed lewat query Supabase PostgREST.
 */
export interface WishlistItemDTO {
  id: string;
  product_id: number;
  note: string | null;
  is_bought: boolean;
  created_at: string;
  /** Relasi embed dari tabel products (nullable bila produk dihapus) */
  products: ProductDTO | null;
}

/**
 * Data minimal yang dikembalikan oleh GET ?select=product_id
 * untuk memuat status hati di halaman beranda.
 */
export interface WishlistProductIdDTO {
  product_id: number;
}

// ─── Model UI ─────────────────────────────────────────────────────────────────

export interface WishlistItem {
  /** UUID baris wishlist */
  id: string;
  /** ID produk (string agar konsisten dengan Product.id di UI) */
  productId: string;
  note?: string;
  isBought: boolean;
  createdAt: string;
  /** Data produk (undefined bila produk sudah dihapus dari DB) */
  product?: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    sellerName: string;
    faculty: string;
    condition: string;
    location: string;
  };
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

export function mapWishlistItem(dto: WishlistItemDTO): WishlistItem {
  let product: WishlistItem['product'] | undefined;
  if (dto.products) {
    const p = dto.products;
    const rawPrice = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
    product = {
      id: String(p.id),
      title: p.title,
      price: isNaN(rawPrice) ? 0 : rawPrice,
      imageUrl: p.image_url,
      sellerName: p.seller_name,
      faculty: p.faculty_name,
      condition: p.condition_desc,
      location: p.cod_location,
    };
  }
  return {
    id: dto.id,
    productId: String(dto.product_id),
    note: dto.note ?? undefined,
    isBought: dto.is_bought,
    createdAt: dto.created_at,
    product,
  };
}
