import React from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type StateViewStatus = 'loading' | 'error' | 'empty';

export interface StateViewProps {
  /** Status tampilan: loading, error, atau empty */
  status: StateViewStatus;
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
 *  - 'loading' : Spinner ActivityIndicator dengan teks "Memuat data... Mohon tunggu sebentar."
 *  - 'error'   : Ikon peringatan, judul "Gagal memuat data", pesan error, dan tombol "Coba Lagi"
 *  - 'empty'   : Ikon kosong dan pesan "Belum ada barang"
 */
export function StateView({
  status,
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
    const errorHeading = title || 'Gagal memuat data';
    const errorMessage =
      message || 'Terjadi kesalahan saat memuat data. Silakan coba lagi.';

    return (
      <View
        style={styles.container}
        accessibilityRole="alert"
        accessibilityLabel={`${errorHeading}. ${errorMessage}. Ketuk tombol Coba Lagi untuk mengulang.`}
      >
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color="#DC2626"
          importantForAccessibility="no"
        />
        <Text style={styles.errorTitle} importantForAccessibility="no">
          {errorHeading}
        </Text>
        <Text style={styles.errorMessage} importantForAccessibility="no">
          {errorMessage}
        </Text>
        {onRetry && (
          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel={retryLabel}
            accessibilityHint="Ketuk untuk memuat ulang data dari server"
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
