/**
 * peta.tsx — Halaman Peta Lokasi KampusMarket
 *
 * Rute: /peta  (di luar grup (tabs) dan (auth))
 * Dibuka melalui tombol "Lihat di Peta" di halaman /lokasi.
 *
 * Alur kerja:
 *  1. Lokasi    : Saat mount, komponen memanggil requestLocationPermission()
 *                 lalu getCurrentLocation() dari locationService.
 *                 Selama proses: ActivityIndicator; peta berpusat di CAMPUS_CENTER.
 *  2. State     : loading → (data | error). Bila error: tombol "Coba Lagi".
 *  3. Peta      : MapView layar penuh (flex:1). showsUserLocation aktif agar
 *                 titik biru bawaan OS juga muncul.
 *  4. Marker    : Setelah lokasi didapat, Marker diletakkan di koordinat pengguna
 *                 dengan judul "Lokasi Saya" dan deskripsi "Lat … · Lng …".
 *  5. Kamera    : animateToRegion() memindahkan kamera ke posisi pengguna
 *                 dengan animasi 800 ms. Delta 0.005° ≈ ±500 m.
 *  6. Tombol    :
 *     - "Pusatkan" → animateToRegion() kembali ke posisi pengguna.
 *     - "+" / "-"  → animateCamera() mengubah zoom ±1 level.
 *
 * Catatan Expo Go / react-native-maps:
 *  - Android  : MapView bekerja di Expo Go menggunakan Google Maps bawaan.
 *  - iOS      : MapView bekerja di Expo Go menggunakan Apple Maps.
 *  - Web      : react-native-maps TIDAK didukung di web / browser.
 *    Jika aplikasi dijalankan di web, komponen menampilkan pesan
 *    "Peta tidak tersedia di platform web."
 *
 * Aturan: tidak mencetak koordinat ke console; tidak menyimpan API key di kode;
 * accessibility label, role, dan tap target ≥ 44×44 di setiap elemen interaktif.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CAMPUS_CENTER } from '@/constants/campus';
import {
  getCurrentLocation,
  LOCATION_ERROR_MESSAGES,
  LocationCoordinates,
  LocationError,
  LocationErrorKind,
  requestLocationPermission,
} from '@/services/locationService';

// react-native-maps tidak tersedia di web — guard platform
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

// ─── Konstanta kamera ────────────────────────────────────────────────────────

/** Delta lintang/bujur awal (± ~550 m). Zoom awal moderat. */
const REGION_DELTA = 0.005;

/** Delta untuk tampilan setelah lokasi didapat (± ~220 m). Lebih dekat. */
const REGION_DELTA_CLOSE = 0.002;

/** Durasi animasi kamera dalam milidetik */
const CAMERA_ANIM_MS = 800;

/** Langkah altitude (meter) untuk zoom + dan - */
const ZOOM_STEP = 500;

// ─── Komponen Utama ───────────────────────────────────────────────────────────

export default function PetaScreen() {
  const router = useRouter();
  const mapRef = useRef<any>(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<LocationCoordinates | null>(null);
  const [error, setError] = useState<{
    kind: LocationErrorKind;
    message: string;
  } | null>(null);

  /** Altitude kamera saat ini untuk kontrol zoom + / - */
  const altitudeRef = useRef(2000);

  // ── Ambil lokasi pengguna ────────────────────────────────────────────────
  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
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

      const location = await getCurrentLocation();
      setCoords(location);
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
  }, []);

  // Ambil lokasi saat mount
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Animasikan kamera ke posisi pengguna setelah koordinat tersedia
  useEffect(() => {
    if (!coords || !mapRef.current) return;

    mapRef.current.animateToRegion(
      {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: REGION_DELTA_CLOSE,
        longitudeDelta: REGION_DELTA_CLOSE,
      },
      CAMERA_ANIM_MS
    );
  }, [coords]);

  // ── Handler: Pusatkan kamera ke posisi pengguna ──────────────────────────
  const handleCenter = useCallback(() => {
    if (!coords || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: REGION_DELTA_CLOSE,
        longitudeDelta: REGION_DELTA_CLOSE,
      },
      CAMERA_ANIM_MS
    );
  }, [coords]);

  // ── Handler: Zoom In (+) ─────────────────────────────────────────────────
  const handleZoomIn = useCallback(() => {
    if (!mapRef.current) return;
    const newAlt = Math.max(100, altitudeRef.current - ZOOM_STEP);
    altitudeRef.current = newAlt;
    mapRef.current.animateCamera({ altitude: newAlt }, { duration: 400 });
  }, []);

  // ── Handler: Zoom Out (-) ────────────────────────────────────────────────
  const handleZoomOut = useCallback(() => {
    if (!mapRef.current) return;
    const newAlt = Math.min(50000, altitudeRef.current + ZOOM_STEP);
    altitudeRef.current = newAlt;
    mapRef.current.animateCamera({ altitude: newAlt }, { duration: 400 });
  }, []);

  // ─── Platform web: tampilkan pesan informatif ─────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <Header onBack={() => router.back()} />
        <View
          style={styles.unsupportedContainer}
          accessibilityRole="alert"
          accessibilityLabel="Peta tidak tersedia di platform web. Gunakan aplikasi mobile."
        >
          <Ionicons name="map-outline" size={56} color="#CBD5E1" importantForAccessibility="no" />
          <Text style={styles.unsupportedTitle} importantForAccessibility="no">
            Peta Tidak Tersedia
          </Text>
          <Text style={styles.unsupportedSubtitle} importantForAccessibility="no">
            Fitur peta hanya tersedia di aplikasi mobile (Android & iOS).{'\n'}
            Buka aplikasi di perangkat fisik atau emulator untuk melihat peta.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render utama (iOS & Android) ────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* ── MapView Layar Penuh ──────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: CAMPUS_CENTER.latitude,
          longitude: CAMPUS_CENTER.longitude,
          latitudeDelta: REGION_DELTA,
          longitudeDelta: REGION_DELTA,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        accessibilityLabel="Peta lokasi pengguna"
        accessibilityHint="Peta interaktif menampilkan posisi Anda saat ini"
      >
        {/* Marker posisi pengguna */}
        {coords && (
          <Marker
            coordinate={{
              latitude: coords.latitude,
              longitude: coords.longitude,
            }}
            title="Lokasi Saya"
            description={`Lat ${coords.latitude.toFixed(6)} · Lng ${coords.longitude.toFixed(6)}`}
            pinColor="#1D4ED8"
          />
        )}
      </MapView>

      {/* ── SafeArea wrapper untuk elemen UI di atas peta ───────────────── */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">

        {/* Header dengan tombol Kembali */}
        <Header onBack={() => router.back()} />

        {/* Kartu info koordinat */}
        {coords && !loading && (
          <View
            style={styles.infoCard}
            accessibilityRole="text"
            accessibilityLabel={
              `Lokasi Saya — Latitude ${coords.latitude.toFixed(6)}, ` +
              `Longitude ${coords.longitude.toFixed(6)}`
            }
          >
            <View style={styles.infoCardRow} importantForAccessibility="no">
              <Ionicons name="location" size={16} color="#1D4ED8" importantForAccessibility="no" />
              <Text style={styles.infoCardTitle} importantForAccessibility="no">
                Lokasi Saya
              </Text>
            </View>
            <View style={styles.infoCardCoords} importantForAccessibility="no">
              <Text style={styles.infoCardLabel} importantForAccessibility="no">Lat</Text>
              <Text style={styles.infoCardValue} importantForAccessibility="no">
                {coords.latitude.toFixed(6)}
              </Text>
              <Text style={[styles.infoCardLabel, { marginLeft: 12 }]} importantForAccessibility="no">
                Lng
              </Text>
              <Text style={styles.infoCardValue} importantForAccessibility="no">
                {coords.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}

        {/* Loading overlay */}
        {loading && (
          <View
            style={styles.loadingCard}
            accessibilityRole="progressbar"
            accessibilityLabel="Sedang mengambil lokasi perangkat"
          >
            <ActivityIndicator size="small" color="#1D4ED8" importantForAccessibility="no" />
            <Text style={styles.loadingText} importantForAccessibility="no">
              Mengambil lokasi…
            </Text>
          </View>
        )}

        {/* Error overlay */}
        {error && !loading && (
          <View
            style={styles.errorCard}
            accessibilityRole="alert"
            accessibilityLabel={`Gagal mengambil lokasi. ${error.message}`}
          >
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color="#DC2626"
              importantForAccessibility="no"
            />
            <Text style={styles.errorText} importantForAccessibility="no">
              {error.kind === 'permission_blocked'
                ? 'Izin lokasi diblokir'
                : error.kind === 'services_disabled'
                  ? 'GPS tidak aktif'
                  : 'Gagal mengambil lokasi'}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
              onPress={fetchLocation}
              accessibilityRole="button"
              accessibilityLabel="Coba Lagi"
              accessibilityHint="Ketuk untuk mencoba mengambil lokasi kembali"
            >
              <Text style={styles.retryText} importantForAccessibility="no">
                Coba Lagi
              </Text>
            </Pressable>
          </View>
        )}

        {/* Tombol kontrol peta (kanan bawah) */}
        <View style={styles.controls} pointerEvents="box-none">
          {/* Zoom In */}
          <Pressable
            style={({ pressed }) => [styles.controlBtn, pressed && styles.buttonPressed]}
            onPress={handleZoomIn}
            accessibilityRole="button"
            accessibilityLabel="Zoom in peta"
            accessibilityHint="Memperbesar tampilan peta"
          >
            <Ionicons name="add" size={22} color="#1D4ED8" importantForAccessibility="no" />
          </Pressable>

          <View style={styles.controlDivider} importantForAccessibility="no" />

          {/* Zoom Out */}
          <Pressable
            style={({ pressed }) => [styles.controlBtn, pressed && styles.buttonPressed]}
            onPress={handleZoomOut}
            accessibilityRole="button"
            accessibilityLabel="Zoom out peta"
            accessibilityHint="Memperkecil tampilan peta"
          >
            <Ionicons name="remove" size={22} color="#1D4ED8" importantForAccessibility="no" />
          </Pressable>

          <View style={styles.controlDivider} importantForAccessibility="no" />

          {/* Pusatkan */}
          <Pressable
            style={({ pressed }) => [
              styles.controlBtn,
              pressed && styles.buttonPressed,
              (!coords || loading) && styles.buttonDisabled,
            ]}
            onPress={handleCenter}
            disabled={!coords || loading}
            accessibilityRole="button"
            accessibilityLabel="Pusatkan peta ke lokasi saya"
            accessibilityHint="Memindahkan tampilan peta kembali ke posisi Anda"
            accessibilityState={{ disabled: !coords || loading }}
          >
            <Ionicons name="locate" size={20} color="#1D4ED8" importantForAccessibility="no" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Sub-komponen: Header ─────────────────────────────────────────────────────

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        accessibilityHint="Ketuk untuk kembali ke halaman Lokasi Saya"
      >
        <Ionicons name="arrow-back" size={20} color="#1D4ED8" importantForAccessibility="no" />
        <Text style={styles.backButtonText} importantForAccessibility="no">
          Kembali
        </Text>
      </Pressable>

      <Text style={styles.headerTitle} accessibilityRole="header">
        Peta Lokasi
      </Text>

      {/* Spacer simetris agar judul benar-benar di tengah */}
      <View style={styles.headerSpacer} importantForAccessibility="no" />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // Overlay transparan di atas MapView
  overlay: {
    flex: 1,
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

  // Kartu info koordinat (pojok kiri atas, di bawah header)
  infoCard: {
    alignSelf: 'flex-start',
    margin: 12,
    backgroundColor: '#FFFFFFEE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    gap: 6,
  },
  infoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  infoCardCoords: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  infoCardValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },

  // Loading
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    margin: 12,
    backgroundColor: '#FFFFFFEE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D4ED8',
  },

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    margin: 12,
    backgroundColor: '#FEF2F2EE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Tombol kontrol peta (kanan bawah)
  controls: {
    position: 'absolute',
    right: 14,
    bottom: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  controlBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },

  // Platform web: pesan tidak tersedia
  unsupportedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
    backgroundColor: '#F8FAFC',
  },
  unsupportedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  unsupportedSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Shared
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
