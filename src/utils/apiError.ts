/**
 * apiError.ts — Class error terstruktur untuk kegagalan request API
 *
 * Digunakan oleh apiClient.ts (authFetch) untuk membedakan jenis kegagalan:
 *  - 'network'      : Tidak ada koneksi internet / fetch gagal tanpa response
 *  - 'http'         : Server membalas dengan status HTTP 4xx/5xx (selain 401)
 *  - 'unauthorized' : Server membalas 401 — memicu logout otomatis
 *  - 'timeout'      : Request melebihi batas waktu (dicadangkan untuk penggunaan masa depan)
 *
 * Properti `message` selalu berisi teks ramah pengguna dalam bahasa Indonesia.
 */

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'unauthorized';

export class ApiError extends Error {
  /** Jenis kegagalan request */
  readonly kind: ApiErrorKind;

  /** Kode status HTTP dari response server (hanya ada bila kind adalah 'http' atau 'unauthorized') */
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;

    // Memastikan instanceof bekerja dengan benar saat dikompilasi ke ES5
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
