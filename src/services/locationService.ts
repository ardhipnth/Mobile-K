/**
 * locationService.ts — Layanan Lokasi GPS KampusMarket menggunakan expo-location
 *
 * Menyediakan:
 *  - requestLocationPermission() : meminta izin lokasi foreground
 *  - getCurrentLocation()        : cek layanan GPS lalu ambil posisi terkini
 *  - LocationError               : error terstruktur dengan pesan Bahasa Indonesia
 *
 * PENTING: Jangan pernah mencetak koordinat atau data lokasi ke console.
 */

import * as Location from 'expo-location';

export type LocationPermissionResult = 'granted' | 'denied' | 'blocked';

export type LocationErrorKind =
  | 'permission_denied'
  | 'permission_blocked'
  | 'services_disabled'
  | 'position_unavailable';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

/**
 * Class error khusus untuk layanan lokasi dengan jenis kesalahan dan pesan
 * ramah pengguna dalam Bahasa Indonesia.
 */
export class LocationError extends Error {
  readonly kind: LocationErrorKind;

  constructor(kind: LocationErrorKind, message: string) {
    super(message);
    this.name = 'LocationError';
    this.kind = kind;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Pesan error standar Bahasa Indonesia untuk setiap kasus kegagalan */
export const LOCATION_ERROR_MESSAGES: Record<LocationErrorKind, string> = {
  permission_denied:
    'Izin lokasi ditolak. Berikan izin akses lokasi agar KampusMarket dapat menampilkan posisimu di area kampus.',
  permission_blocked:
    'Izin lokasi diblokir oleh sistem. Buka Pengaturan perangkat dan aktifkan izin lokasi untuk KampusMarket.',
  services_disabled:
    'Layanan lokasi (GPS) sedang mati. Silakan aktifkan GPS pada perangkatmu terlebih dahulu.',
  position_unavailable:
    'Gagal mendapatkan posisi lokasi saat ini. Pastikan sinyal GPS memadai lalu coba lagi.',
};

/**
 * Meminta izin akses lokasi foreground kepada pengguna.
 *
 * @returns 'granted' jika diizinkan, 'blocked' jika ditolak dan canAskAgain === false,
 *          atau 'denied' jika ditolak namun masih bisa diminta lagi.
 */
export async function requestLocationPermission(): Promise<LocationPermissionResult> {
  try {
    const response = await Location.requestForegroundPermissionsAsync();

    if (response.status === 'granted' || response.granted) {
      return 'granted';
    }

    if (response.canAskAgain === false) {
      return 'blocked';
    }

    return 'denied';
  } catch {
    return 'denied';
  }
}

/**
 * Mengambil posisi GPS perangkat saat ini dengan akurasi seimbang (Balanced).
 * Memeriksa apakah layanan lokasi (GPS) aktif dan izin tersedia terlebih dahulu.
 *
 * @returns { latitude, longitude, accuracy }
 * @throws LocationError dengan pesan Bahasa Indonesia bila GPS mati, izin ditolak/diblokir,
 *         atau gagal memperoleh posisi.
 */
export async function getCurrentLocation(): Promise<LocationCoordinates> {
  // 1. Periksa status layanan lokasi (GPS) perangkat
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new LocationError(
      'services_disabled',
      LOCATION_ERROR_MESSAGES.services_disabled
    );
  }

  // 2. Pastikan izin foreground sudah diberikan sebelum mengambil posisi
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted && permission.status !== 'granted') {
    if (permission.canAskAgain === false) {
      throw new LocationError(
        'permission_blocked',
        LOCATION_ERROR_MESSAGES.permission_blocked
      );
    }
    throw new LocationError(
      'permission_denied',
      LOCATION_ERROR_MESSAGES.permission_denied
    );
  }

  // 3. Ambil posisi GPS dengan akurasi Balanced
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    if (
      !position?.coords ||
      typeof position.coords.latitude !== 'number' ||
      typeof position.coords.longitude !== 'number'
    ) {
      throw new LocationError(
        'position_unavailable',
        LOCATION_ERROR_MESSAGES.position_unavailable
      );
    }

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy:
        typeof position.coords.accuracy === 'number'
          ? position.coords.accuracy
          : null,
    };
  } catch (err) {
    if (err instanceof LocationError) {
      throw err;
    }
    throw new LocationError(
      'position_unavailable',
      LOCATION_ERROR_MESSAGES.position_unavailable
    );
  }
}
