import React from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiErrorKind } from '@/utils/apiError';

export type StateViewStatus = 'loading' | 'error' | 'empty';

export interface StateViewProps {
  /** Status tampilan: loading, error, atau empty */
  status: StateViewStatus;
  /**
   * Jenis error dari ApiError (hanya relevan bila status === 'error').
   * Menentukan tampilan: 'network' → offline, 'timeout' → timeout, lainnya → server error.
   */
  errorKind?: ApiErrorKind;
  /** Judul khusus (opsional, jika tidak diset menggunakan judul default tiap status) */
  title?: string;
  /** Pesan penjelasan atau pesan dari ApiError */
  message?: string;
  /** Callback saat tombol "Coba Lagi" ditekan pada kondisi error */
  onRetry?: () => void;
  /** Label tombol retry (default: 'Coba Lagi') */
  retryLabel?: string;
}

/**
 * StateView — Komponen reusable untuk menampilkan status request:
 *  - 'loading' : Spinner ActivityIndicator
 *  - 'error'   : Tampilan berbeda berdasarkan errorKind:
 *      - 'network'  → ikon wifi mati, teks offline, tombol Coba Lagi
 *      - 'timeout'  → ikon jam, teks timeout, tombol Coba Lagi
 *      - lainnya    → ikon peringatan, teks server error, tombol Coba Lagi
 *  - 'empty'   : Ikon kosong dan pesan "Belum ada barang"
 */
export function StateView({
  status,
  errorKind,
  title,
  message,
  onRetry,
  retryLabel = 'Coba Lagi',
}: StateViewProps) {
  if (status === 'loading') {
    return (
      <View
        style={styles.container}
        accessibilityRole="progressbar"
        accessibilityLabel="Memuat data... Mohon tunggu sebentar."
      >
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText} importantForAccessibility="no">
          Memuat data... Mohon tunggu sebentar.
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    // ── Tentukan konten berdasarkan jenis error ────────────────────────────────
    let iconName: keyof typeof Ionicons.glyphMap;
    let iconColor: string;
    let defaultTitle: string;
    let defaultMessage: string;
    let a11yRetryHint: string;

    if (errorKind === 'network') {
      // Tampilan offline: tidak ada koneksi internet
      iconName = 'wifi-outline';
      iconColor = '#64748B';
      defaultTitle = title ?? 'Tidak ada koneksi internet';
      defaultMessage =
        message ?? 'Periksa koneksi Anda dan coba lagi.';
      a11yRetryHint = 'Ketuk untuk mencoba kembali setelah koneksi internet tersambung';
    } else if (errorKind === 'timeout') {
      // Tampilan timeout: server tidak merespons tepat waktu
      iconName = 'time-outline';
      iconColor = '#D97706';
      defaultTitle = title ?? 'Koneksi Lambat';
      defaultMessage =
        message ?? 'Waktu habis. Server terlalu lama merespons.';
      a11yRetryHint = 'Ketuk untuk mencoba mengirim permintaan ulang ke server';
    } else {
      // Tampilan error server: HTTP 4xx/5xx atau error tidak dikenal
      iconName = 'alert-circle-outline';
      iconColor = '#DC2626';
      defaultTitle = title ?? 'Gagal memuat data';
      defaultMessage =
        message ?? 'Terjadi kesalahan saat memuat data. Silakan coba lagi.';
      a11yRetryHint = 'Ketuk untuk memuat ulang data dari server';
    }

    return (
      <View
        style={styles.container}
        accessibilityRole="alert"
        accessibilityLabel={`${defaultTitle}. ${defaultMessage}. Ketuk tombol ${retryLabel} untuk mengulang.`}
      >
        <Ionicons
          name={iconName}
          size={48}
          color={iconColor}
          importantForAccessibility="no"
        />
        <Text
          style={[
            styles.errorTitle,
            errorKind === 'network' && styles.offlineTitleColor,
            errorKind === 'timeout' && styles.timeoutTitleColor,
          ]}
          importantForAccessibility="no"
        >
          {defaultTitle}
        </Text>
        <Text style={styles.errorMessage} importantForAccessibility="no">
          {defaultMessage}
        </Text>
        {onRetry && (
          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              errorKind === 'network' && styles.retryButtonOffline,
              pressed && styles.retryButtonPressed,
            ]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel={retryLabel}
            accessibilityHint={a11yRetryHint}
          >
            <Ionicons
              name="refresh"
              size={18}
              color="#FFFFFF"
              importantForAccessibility="no"
            />
            <Text style={styles.retryButtonText} importantForAccessibility="no">
              {retryLabel}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (status === 'empty') {
    const emptyTitle = title || 'Belum ada barang';
    const emptyMessage =
      message ||
      'Belum ada barang bekas yang tersedia saat ini. Jadilah yang pertama berjualan!';

    return (
      <View
        style={styles.container}
        accessibilityRole="text"
        accessibilityLabel={`${emptyTitle}. ${emptyMessage}`}
      >
        <Ionicons
          name="file-tray-outline"
          size={48}
          color="#94A3B8"
          importantForAccessibility="no"
        />
        <Text style={styles.emptyTitle} importantForAccessibility="no">
          {emptyTitle}
        </Text>
        <Text style={styles.emptySubtitle} importantForAccessibility="no">
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 12,
    textAlign: 'center',
  },
  /** Warna judul khusus status offline */
  offlineTitleColor: {
    color: '#334155',
  },
  /** Warna judul khusus status timeout */
  timeoutTitleColor: {
    color: '#D97706',
  },
  errorMessage: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    minHeight: 44,
    minWidth: 44,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  /** Varian tombol retry untuk kondisi offline (warna netral/abu) */
  retryButtonOffline: {
    backgroundColor: '#475569',
    shadowColor: '#475569',
  },
  retryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
