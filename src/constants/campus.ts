/**
 * campus.ts — Konstanta lokasi kampus KampusMarket
 *
 * CAMPUS_CENTER adalah nilai sementara; ganti dengan koordinat kampus
 * yang sebenarnya sebelum rilis.
 */

/** Nama area kampus yang ditampilkan di UI */
export const CAMPUS_NAME = 'Area Kampus';

/**
 * Pusat koordinat kampus (nilai sementara — ganti dengan titik kampus asli).
 * Contoh di bawah adalah Universitas Brawijaya, Malang.
 */
export const CAMPUS_CENTER = {
  latitude: -7.9666,
  longitude: 112.6326,
} as const;

/**
 * Radius area kampus dalam meter.
 * Dipakai untuk referensi batas area, bukan ditampilkan sebagai lingkaran saat ini.
 */
export const CAMPUS_RADIUS_M = 500;
