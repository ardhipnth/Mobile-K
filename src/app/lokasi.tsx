/**
 * lokasi.tsx — Halaman "Lokasi Saya" KampusMarket
 *
 * Rute: /lokasi (di luar grup (tabs) dan (auth))
 * Dibuka melalui tombol "Lokasi Saya" di halaman Profil.
 *
 * Alur kerja:
 *  1. Pengguna menekan tombol "Ambil Lokasi" (atau "Coba Lagi").
 *  2. Aplikasi meminta izin foreground via requestLocationPermission().
 *     - 'blocked' → tampilkan pesan + tombol "Buka Pengaturan" (Linking.openSettings()).
 *     - 'denied'  → tampilkan pesan + tombol "Coba Lagi".
 *     - 'granted' → lanjut memanggil getCurrentLocation().
 *  3. getCurrentLocation() mengecek GPS aktif lalu membaca koordinat dengan
 *     Location.Accuracy.Balanced.
 *  4. State loading / error / data diperbarui, lalu UI menampilkan hasil di kartu
 *     "Lokasi Saat Ini" (Latitude, Longitude, Akurasi ±x m).
 *
 * Keamanan: tidak mencetak koordinat atau data sensitif ke console.
 * Aksesibilitas: accessibilityLabel, accessibilityRole, tap target minimal 44x44.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getCurrentLocation,
  LOCATION_ERROR_MESSAGES,
  LocationCoordinates,
  LocationError,
  LocationErrorKind,
  requestLocationPermission,
} from '@/services/locationService';

export default function LokasiScreen() {
  const router = useRouter();

  // ── State utama: loading, error, data ─────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    kind: LocationErrorKind;
    message: string;
  } | null>(null);
  const [data, setData] = useState<LocationCoordinates | null>(null);

  // ── Handler: Minta izin → ambil lokasi → simpan ke state ──────────────────
  const handleFetchLocation = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Minta izin lokasi foreground
      const permission = await requestLocationPermission();

      if (permission === 'blocked') {
        setError({
          kind: 'permission_blocked',
          message: LOCATION_ERROR_MESSAGES.permission_blocked,
        });
        return;
      }

      if (permission === 'denied') {
        setError({
          kind: 'permission_denied',
          message: LOCATION_ERROR_MESSAGES.permission_denied,
        });
        return;
      }

      // 2. Ambil koordinat saat ini dari GPS
      const coords = await getCurrentLocation();
      setData(coords);
    } catch (err) {
      if (err instanceof LocationError) {
        setError({ kind: err.kind, message: err.message });
      } else {
        setError({
          kind: 'position_unavailable',
          message: LOCATION_ERROR_MESSAGES.position_unavailable,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // ── Handler: Buka pengaturan sistem saat izin diblokir ────────────────────
  const handleOpenSettings = useCallback(() => {
    if (Platform.OS !== 'web') {
      Linking.openSettings();
    }
  }, []);

  const accuracyText =
    data?.accuracy !== null && data?.accuracy !== undefined
      ? `±${Math.round(data.accuracy)} m`
      : 'Tidak tersedia';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.screenContainer}>
        {/* ── Header dengan tombol Kembali ──────────────────────────────── */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            accessibilityHint="Ketuk untuk kembali ke halaman sebelumnya"
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color="#1D4ED8"
              importantForAccessibility="no"
            />
            <Text style={styles.backButtonText} importantForAccessibility="no">
              Kembali
            </Text>
          </Pressable>

          <Text style={styles.headerTitle} accessibilityRole="header">
            Lokasi Saya
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Penjelasan tujuan izin lokasi ────────────────────────────── */}
          <View
            style={styles.infoBanner}
            accessibilityRole="text"
            accessibilityLabel="Lokasi dipakai untuk menampilkan posisimu dan area kampus."
          >
            <View style={styles.infoIconCircle} importantForAccessibility="no">
              <Ionicons
                name="navigate-circle-outline"
                size={22}
                color="#1D4ED8"
                importantForAccessibility="no"
              />
            </View>
            <Text style={styles.infoBannerText} importantForAccessibility="no">
              Lokasi dipakai untuk menampilkan posisimu dan area kampus agar
              transaksi COD lebih mudah.
            </Text>
          </View>

          {/* ── Kartu "Lokasi Saat Ini" ─────────────────────────────────── */}
          <View
            style={styles.locationCard}
            accessibilityRole="summary"
            accessibilityLabel={
              data
                ? `Lokasi Saat Ini: Latitude ${data.latitude.toFixed(6)}, Longitude ${data.longitude.toFixed(6)}, Akurasi ${accuracyText}`
                : 'Kartu Lokasi Saat Ini belum memiliki data posisi'
            }
          >
            <View style={styles.cardHeaderRow} importantForAccessibility="no">
              <View style={styles.cardTitleGroup}>
                <Ionicons
                  name="location"
                  size={20}
                  color="#1D4ED8"
                  importantForAccessibility="no"
                />
                <Text style={styles.cardTitle}>Lokasi Saat Ini</Text>
              </View>
              {data && !loading && (
                <View style={styles.readyBadge}>
                  <Text style={styles.readyBadgeText}>Tersedia</Text>
                </View>
              )}
            </View>

            {loading ? (
              <View
                style={styles.loadingBox}
                accessibilityRole="progressbar"
                accessibilityLabel="Sedang mengambil lokasi perangkat"
              >
                <ActivityIndicator size="large" color="#1D4ED8" />
                <Text style={styles.loadingText} importantForAccessibility="no">
                  Mengambil posisi GPS perangkat...
                </Text>
              </View>
            ) : error ? (
              <View
                style={styles.errorBox}
                accessibilityRole="alert"
                accessibilityLabel={`Gagal mengambil lokasi. ${error.message}`}
              >
                <Ionicons
                  name={
                    error.kind === 'permission_blocked'
                      ? 'lock-closed-outline'
                      : 'alert-circle-outline'
                  }
                  size={40}
                  color="#DC2626"
                  importantForAccessibility="no"
                />
                <Text style={styles.errorTitle} importantForAccessibility="no">
                  {error.kind === 'permission_blocked'
                    ? 'Izin Lokasi Diblokir'
                    : error.kind === 'services_disabled'
                      ? 'GPS Tidak Aktif'
                      : 'Lokasi Tidak Dapat Diambil'}
                </Text>
                <Text style={styles.errorMessage} importantForAccessibility="no">
                  {error.message}
                </Text>

                {error.kind === 'permission_blocked' ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryActionButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleOpenSettings}
                    accessibilityRole="button"
                    accessibilityLabel="Buka Pengaturan"
                    accessibilityHint="Membuka pengaturan aplikasi untuk mengaktifkan izin lokasi"
                  >
                    <Ionicons
                      name="settings-outline"
                      size={18}
                      color="#FFFFFF"
                      importantForAccessibility="no"
                    />
                    <Text
                      style={styles.actionButtonText}
                      importantForAccessibility="no"
                    >
                      Buka Pengaturan
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryActionButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleFetchLocation}
                    accessibilityRole="button"
                    accessibilityLabel="Coba Lagi"
                    accessibilityHint="Ketuk untuk mencoba mengambil lokasi perangkat kembali"
                  >
                    <Ionicons
                      name="refresh"
                      size={18}
                      color="#FFFFFF"
                      importantForAccessibility="no"
                    />
                    <Text
                      style={styles.actionButtonText}
                      importantForAccessibility="no"
                    >
                      Coba Lagi
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : data ? (
              <View style={styles.coordsContainer} importantForAccessibility="no">
                <View style={styles.coordRow}>
                  <Text style={styles.coordLabel}>Latitude</Text>
                  <Text style={styles.coordValue}>
                    {data.latitude.toFixed(6)}
                  </Text>
                </View>

                <View style={styles.coordRow}>
                  <Text style={styles.coordLabel}>Longitude</Text>
                  <Text style={styles.coordValue}>
                    {data.longitude.toFixed(6)}
                  </Text>
                </View>

                <View style={[styles.coordRow, styles.coordRowLast]}>
                  <Text style={styles.coordLabel}>Akurasi</Text>
                  <Text style={styles.coordValue}>{accuracyText}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyBox} importantForAccessibility="no">
                <Ionicons
                  name="compass-outline"
                  size={40}
                  color="#94A3B8"
                  importantForAccessibility="no"
                />
                <Text style={styles.emptyTitle}>Belum Ada Data Lokasi</Text>
                <Text style={styles.emptySubtitle}>
                  Tekan tombol &quot;Ambil Lokasi&quot; di bawah untuk membaca
                  koordinat GPS perangkatmu.
                </Text>
              </View>
            )}
          </View>

          {/* ── Tombol Utama "Ambil Lokasi" ─────────────────────────────── */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleFetchLocation}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={
              loading ? 'Sedang mengambil lokasi' : 'Ambil Lokasi'
            }
            accessibilityHint="Meminta izin lokasi dan mengambil koordinat GPS perangkat saat ini"
            accessibilityState={{ busy: loading, disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name="locate"
                size={20}
                color="#FFFFFF"
                importantForAccessibility="no"
              />
            )}
            <Text style={styles.primaryButtonText} importantForAccessibility="no">
              {loading ? 'Mengambil Lokasi...' : 'Ambil Lokasi'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─── StyleSheet (Tema Putih & Biru KampusMarket) ──────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerSpacer: {
    minWidth: 84,
  },

  // Scroll konten
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
    gap: 16,
  },

  // Info tujuan izin
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#1E3A8A',
    fontWeight: '500',
  },

  // Kartu Lokasi Saat Ini
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  readyBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  readyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },

  // Loading
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },

  // Error
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 4,
  },
  errorMessage: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 8,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    minHeight: 44,
    minWidth: 44,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Koordinat
  coordsContainer: {
    gap: 4,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  coordRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  coordLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  coordValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },

  // Kosong awal
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Tombol utama
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1D4ED8',
    minHeight: 48,
    minWidth: 44,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
