/**
 * secureStore.ts — Abstraksi penyimpanan aman berbasis expo-secure-store
 *
 * Menggunakan hardware-backed keychain (iOS Keychain / Android KeyStore).
 * Memiliki fallback otomatis ke AsyncStorage pada platform Web (di mana native KeyStore tidak tersedia).
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const SECURE_STORAGE_KEYS = {
  SESSION_TOKEN: 'km_session_token',
} as const;

/**
 * Menyimpan data sensitif (misal: token JWT sesi) ke penyimpanan terenkripsi hardware.
 * Memanggil SecureStore.setItemAsync pada Android & iOS.
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    const isAvailable = Platform.OS !== 'web' && (await SecureStore.isAvailableAsync());
    if (isAvailable) {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } else {
      // Fallback untuk Web development preview
      await AsyncStorage.setItem(key, value);
    }
  } catch (error) {
    console.error(`[SecureStore] Gagal menyimpan data untuk key "${key}":`, error);
    throw error;
  }
}

/**
 * Membaca data sensitif dari penyimpanan terenkripsi hardware.
 * Memanggil SecureStore.getItemAsync pada Android & iOS.
 */
export async function getSecureItem(key: string): Promise<string | null> {
  try {
    const isAvailable = Platform.OS !== 'web' && (await SecureStore.isAvailableAsync());
    if (isAvailable) {
      return await SecureStore.getItemAsync(key);
    } else {
      // Fallback untuk Web development preview
      return await AsyncStorage.getItem(key);
    }
  } catch (error) {
    console.error(`[SecureStore] Gagal mengambil data untuk key "${key}":`, error);
    return null;
  }
}

/**
 * Menghapus data sensitif saat pengguna logout.
 * Memanggil SecureStore.deleteItemAsync pada Android & iOS.
 */
export async function deleteSecureItem(key: string): Promise<void> {
  try {
    const isAvailable = Platform.OS !== 'web' && (await SecureStore.isAvailableAsync());
    if (isAvailable) {
      await SecureStore.deleteItemAsync(key);
    } else {
      // Fallback untuk Web development preview
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`[SecureStore] Gagal menghapus data untuk key "${key}":`, error);
  }
}

/** Helper khusus untuk token sesi: setItemAsync */
export async function saveSessionToken(token: string): Promise<void> {
  return setSecureItem(SECURE_STORAGE_KEYS.SESSION_TOKEN, token);
}

/** Helper khusus untuk token sesi: getItemAsync */
export async function getSessionToken(): Promise<string | null> {
  return getSecureItem(SECURE_STORAGE_KEYS.SESSION_TOKEN);
}

/** Helper khusus untuk token sesi: deleteItemAsync */
export async function deleteSessionToken(): Promise<void> {
  return deleteSecureItem(SECURE_STORAGE_KEYS.SESSION_TOKEN);
}
