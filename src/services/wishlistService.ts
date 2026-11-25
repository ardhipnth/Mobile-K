/**
 * wishlistService.ts — CRUD Wishlist Marketplace ke Supabase REST API
 *
 * Semua request melewati authFetch yang sudah menangani:
 *  - Header apikey + Authorization Bearer
 *  - ApiError kind 'network' | 'http' | 'unauthorized'
 *
 * PENTING: Tidak ada pencetakan token atau data sensitif ke console.
 * Konversi product_id string → number dilakukan di sini, bukan di UI.
 */

import { authFetch } from '@/services/apiClient';
import {
  WishlistItem,
  WishlistItemDTO,
  WishlistProductIdDTO,
  mapWishlistItem,
} from '@/types/wishlist';

// ─── Kolom detail untuk halaman wishlist (dengan JOIN products) ───────────────
const DETAIL_SELECT = [
  'id',
  'product_id',
  'note',
  'is_bought',
  'created_at',
  'products(id,title,price,faculty_name,condition_desc,cod_location,image_url,seller_name,is_nim_verified)',
].join(',');

// ─── GET: semua product_id wishlist (untuk status hati di beranda) ────────────

/**
 * Mengambil hanya daftar product_id dari wishlist pengguna.
 * Digunakan untuk mewarnai ikon hati di kartu produk beranda.
 *
 * @returns Set<string> berisi product_id (sebagai string) yang ada di wishlist
 */
export async function fetchWishlistProductIds(
  signal?: AbortSignal
): Promise<Set<string>> {
  const response = await authFetch(
    '/rest/v1/wishlist?select=product_id',
    { signal }
  );
  const data: WishlistProductIdDTO[] = await response.json();
  return new Set(data.map((row) => String(row.product_id)));
}

// ─── GET: detail wishlist dengan data produk (untuk halaman wishlist) ─────────

/**
 * Mengambil seluruh item wishlist lengkap dengan data produk (JOIN).
 * Diurutkan dari yang terbaru.
 */
export async function fetchWishlist(signal?: AbortSignal): Promise<WishlistItem[]> {
  const response = await authFetch(
    `/rest/v1/wishlist?select=${DETAIL_SELECT}&order=created_at.desc`,
    { signal }
  );
  const data: WishlistItemDTO[] = await response.json();
  return data.map(mapWishlistItem);
}

// ─── POST: tambah produk ke wishlist ─────────────────────────────────────────

/**
 * Menambahkan produk ke wishlist.
 * product_id UI (string) dikonversi ke number sebelum dikirim.
 * Header Prefer: return=representation agar Supabase mengembalikan data baru.
 *
 * @param productId ID produk (string dari UI)
 * @returns WishlistItem yang baru dibuat
 * @throws ApiError — termasuk status 409 bila duplikat (ditangani di pemanggil)
 */
export async function addToWishlist(productId: string): Promise<WishlistItem> {
  const response = await authFetch('/rest/v1/wishlist', {
    method: 'POST',
    body: JSON.stringify({ product_id: Number(productId) }),
    headers: { Prefer: 'return=representation' },
  });
  const data: WishlistItemDTO[] = await response.json();
  if (!data || data.length === 0) {
    throw new Error('Server tidak mengembalikan data item baru.');
  }
  return mapWishlistItem(data[0]);
}

// ─── PATCH: toggle is_bought ──────────────────────────────────────────────────

/**
 * Mengubah status `is_bought` item wishlist.
 *
 * @param wishlistId UUID baris wishlist (bukan product_id)
 * @param isBought   Nilai baru is_bought
 * @returns WishlistItem yang sudah diperbarui
 */
export async function updateWishlistBought(
  wishlistId: string,
  isBought: boolean
): Promise<WishlistItem> {
  const response = await authFetch(`/rest/v1/wishlist?id=eq.${wishlistId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_bought: isBought }),
    headers: { Prefer: 'return=representation' },
  });
  const data: WishlistItemDTO[] = await response.json();
  if (!data || data.length === 0) {
    throw new Error('Item tidak ditemukan atau tidak ada perubahan.');
  }
  return mapWishlistItem(data[0]);
}

// ─── DELETE: hapus dari wishlist ──────────────────────────────────────────────

/**
 * Menghapus item wishlist berdasarkan product_id.
 * product_id UI (string) dikonversi ke number sebelum dikirim.
 *
 * @param productId ID produk (string dari UI)
 */
export async function removeFromWishlist(productId: string): Promise<void> {
  await authFetch(
    `/rest/v1/wishlist?product_id=eq.${Number(productId)}`,
    { method: 'DELETE' }
  );
}
