/**
 * sensor.tsx — Halaman Sensor Accelerometer KampusMarket
 *
 * Alur kerja:
 *  1. Sensor     : Accelerometer.isAvailableAsync() memverifikasi sensor ada di perangkat.
 *  2. Permission : Accelerometer.requestPermissionsAsync() diminta satu kali.
 *                  Bila ditolak → tampilkan pesan + tombol "Buka Pengaturan".
 *  3. Listener   : Accelerometer.addListener() dipasang; subscription disimpan di ref
 *                  lalu dilepas (subscription.remove()) saat unmount.
 *  4. Data       : Nilai {x, y, z} disimpan di state dan diperbarui tiap listener terpicu.
 *  5. UI         : Nilai x/y/z tampil dalam kartu, tema putih–teal sesuai KampusMarket.
 *
 * Aksesibilitas : accessibilityLabel, accessibilityRole, accessibilityHint di setiap
 *                 elemen interaktif. Tap target minimal 44×44.
 * Debug         : console.log hanya berjalan saat __DEV__ === true.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
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
type Subscription = ReturnType<typeof Accelerometer.addListener>;

// ─── Tipe Data ────────────────────────────────────────────────────────────────

type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface AccelData {
  x: number;
  y: number;
  z: number;
}

// ─── Konstanta ────────────────────────────────────────────────────────────────

/** Interval update listener dalam milidetik */
const UPDATE_INTERVAL_MS = 100;

// ─── Komponen Utama ───────────────────────────────────────────────────────────

export default function SensorScreen() {
  const router = useRouter();

  // State: ketersediaan sensor dan status izin
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null); // null = belum dicek
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [isListening, setIsListening] = useState(false);

  // State: data accelerometer
  const [accelData, setAccelData] = useState<AccelData>({ x: 0, y: 0, z: 0 });

  // Ref: simpan subscription agar bisa dilepas saat unmount
  const subscriptionRef = useRef<Subscription | null>(null);

  // ── Lepas listener saat unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, []);

  // ── 1. Cek ketersediaan sensor saat layar pertama kali tampil ────────────
  useEffect(() => {
    let cancelled = false;

    const checkAvailability = async () => {
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (!cancelled) setIsAvailable(available);
      } catch {
        if (!cancelled) setIsAvailable(false);
      }
    };

    checkAvailability();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── 2. Minta izin accelerometer ──────────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      // API permission hanya tersedia di Android/iOS expo-sensors modern
      if (typeof Accelerometer.requestPermissionsAsync !== 'function') {
        setPermissionStatus('granted');
        return 'granted';
      }

      const { status } = await Accelerometer.requestPermissionsAsync();
      const mapped: PermissionStatus =
        status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
      setPermissionStatus(mapped);
      return mapped;
    } catch {
      // Fallback jika API bermasalah: coba pasang listener saja
      setPermissionStatus('granted');
      return 'granted';
    }
  }, []);

  // ── 3. Pasang listener accelerometer ─────────────────────────────────────
  const startListening = useCallback(async () => {
    if (!isAvailable) return;

    // Minta izin bila belum ditentukan
    let currentStatus = permissionStatus;
    if (currentStatus === 'undetermined') {
      currentStatus = await requestPermission();
    }
    if (currentStatus === 'denied') return;

    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);

    // Pasang listener; simpan subscription ke ref
    subscriptionRef.current = Accelerometer.addListener((data: AccelData) => {
      // 4. Simpan nilai ke state → UI diperbarui otomatis
      setAccelData(data);

      // 5. Debug: cetak hanya di mode development
      if (__DEV__) {
        console.log(
          `[Accelerometer] x=${data.x.toFixed(4)}  y=${data.y.toFixed(4)}  z=${data.z.toFixed(4)}`
        );
      }
    });

    setIsListening(true);
  }, [isAvailable, permissionStatus, requestPermission]);

  // ── Hentikan listener ─────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setIsListening(false);
  }, []);

  // ── Toggle Mulai / Hentikan ───────────────────────────────────────────────
  const handleToggle = useCallback(async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  // ── Buka Pengaturan (bila izin ditolak) ──────────────────────────────────
  const handleOpenSettings = useCallback(() => {
    if (Platform.OS !== 'web') {
      Linking.openSettings();
    }
  }, []);

  // ─── Render: sensor tidak tersedia ────────────────────────────────────────
  if (isAvailable === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.screenContainer}>
          <PageHeader router={router} />
          <View
            style={styles.feedbackContainer}
            accessibilityRole="alert"
            accessibilityLabel="Sensor tidak tersedia di perangkat ini"
          >
            <Ionicons
              name="hardware-chip-outline"
              size={56}
              color="#CBD5E1"
              importantForAccessibility="no"
            />
            <Text style={styles.feedbackTitle} importantForAccessibility="no">
              Sensor Tidak Tersedia
            </Text>
            <Text style={styles.feedbackSubtitle} importantForAccessibility="no">
              Sensor tidak tersedia di perangkat ini.{'\n'}
              Coba di perangkat fisik Android atau iOS.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render: izin ditolak ─────────────────────────────────────────────────
  if (permissionStatus === 'denied') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.screenContainer}>
          <PageHeader router={router} />
          <View
            style={styles.feedbackContainer}
            accessibilityRole="alert"
            accessibilityLabel="Izin sensor ditolak. Buka pengaturan untuk memberikan akses."
          >
            <Ionicons
              name="lock-closed-outline"
              size={56}
              color="#FCA5A5"
              importantForAccessibility="no"
            />
            <Text style={styles.feedbackTitle} importantForAccessibility="no">
              Izin Ditolak
            </Text>
            <Text style={styles.feedbackSubtitle} importantForAccessibility="no">
              Akses sensor gerak diperlukan agar fitur ini berjalan.{'\n'}
              Buka pengaturan dan aktifkan izin sensor gerak untuk aplikasi ini.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.settingsButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Buka Pengaturan izin sensor"
              accessibilityHint="Membuka halaman pengaturan sistem untuk mengaktifkan izin sensor gerak"
            >
              <Ionicons
                name="settings-outline"
                size={18}
                color="#FFFFFF"
                importantForAccessibility="no"
              />
              <Text style={styles.settingsButtonText} importantForAccessibility="no">
                Buka Pengaturan
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render utama ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.screenContainer}>
        <PageHeader router={router} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Kartu Status Sensor ─────────────────────────────────────── */}
          <View
            style={[
              styles.statusCard,
              isListening ? styles.statusCardActive : styles.statusCardIdle,
            ]}
            accessibilityRole="text"
            accessibilityLabel={
              isListening
                ? 'Sensor aktif, membaca data accelerometer secara real-time'
                : 'Sensor tidak aktif, tekan tombol Mulai untuk memulai'
            }
          >
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  isListening ? styles.statusDotActive : styles.statusDotIdle,
                ]}
                importantForAccessibility="no"
              />
              <Text
                style={[
                  styles.statusText,
                  isListening ? styles.statusTextActive : styles.statusTextIdle,
                ]}
                importantForAccessibility="no"
              >
                {isListening ? 'Sensor Aktif' : 'Sensor Tidak Aktif'}
              </Text>
            </View>
            <Text style={styles.statusDesc} importantForAccessibility="no">
              {isListening
                ? `Diperbarui setiap ${UPDATE_INTERVAL_MS} ms`
                : 'Tekan tombol di bawah untuk mulai membaca data'}
            </Text>
          </View>

          {/* ── Kartu Nilai x / y / z ───────────────────────────────────── */}
          <View
            style={styles.dataCard}
            accessibilityRole="text"
            accessibilityLabel={
              `Nilai accelerometer: ` +
              `X ${accelData.x.toFixed(3)}, ` +
              `Y ${accelData.y.toFixed(3)}, ` +
              `Z ${accelData.z.toFixed(3)}`
            }
          >
            <Text style={styles.dataCardTitle} importantForAccessibility="no">
              Data Accelerometer (g)
            </Text>

            <View style={styles.axisGrid} importantForAccessibility="no">
              {/* Sumbu X */}
              <View style={[styles.axisCard, styles.axisCardX]}>
                <Text style={styles.axisLabel}>Sumbu X</Text>
                <Text style={styles.axisValue}>{accelData.x.toFixed(4)}</Text>
                <Text style={styles.axisDesc}>Kiri ↔ Kanan</Text>
              </View>

              {/* Sumbu Y */}
              <View style={[styles.axisCard, styles.axisCardY]}>
                <Text style={styles.axisLabel}>Sumbu Y</Text>
                <Text style={styles.axisValue}>{accelData.y.toFixed(4)}</Text>
                <Text style={styles.axisDesc}>Atas ↕ Bawah</Text>
              </View>

              {/* Sumbu Z */}
              <View style={[styles.axisCard, styles.axisCardZ]}>
                <Text style={styles.axisLabel}>Sumbu Z</Text>
                <Text style={styles.axisValue}>{accelData.z.toFixed(4)}</Text>
                <Text style={styles.axisDesc}>Depan ↔ Belakang</Text>
              </View>
            </View>

            {/* Magnitude (besar vektor) */}
            <View style={styles.magnitudeRow} importantForAccessibility="no">
              <Text style={styles.magnitudeLabel}>Magnitude (|a|)</Text>
              <Text style={styles.magnitudeValue}>
                {Math.sqrt(
                  accelData.x ** 2 + accelData.y ** 2 + accelData.z ** 2
                ).toFixed(4)}{' '}
                g
              </Text>
            </View>
          </View>

          {/* ── Tombol Mulai / Hentikan ─────────────────────────────────── */}
          <Pressable
            style={({ pressed }) => [
              styles.toggleButton,
              isListening ? styles.toggleButtonStop : styles.toggleButtonStart,
              pressed && styles.buttonPressed,
              isAvailable === null && styles.buttonDisabled,
            ]}
            onPress={handleToggle}
            disabled={isAvailable === null}
            accessibilityRole="button"
            accessibilityLabel={isListening ? 'Hentikan Sensor' : 'Mulai Baca Sensor'}
            accessibilityHint={
              isListening
                ? 'Menghentikan pembacaan data accelerometer'
                : 'Memulai pembacaan data accelerometer secara real-time'
            }
            accessibilityState={{ busy: isListening }}
          >
            <Ionicons
              name={isListening ? 'stop-circle-outline' : 'play-circle-outline'}
              size={22}
              color="#FFFFFF"
              importantForAccessibility="no"
            />
            <Text style={styles.toggleButtonText} importantForAccessibility="no">
              {isListening ? 'Hentikan Sensor' : 'Mulai Baca Sensor'}
            </Text>
          </Pressable>

          {/* ── Info Box ────────────────────────────────────────────────── */}
          <View
            style={styles.infoBox}
            accessibilityRole="text"
            accessibilityLabel={
              'Informasi: Accelerometer mengukur percepatan linear perangkat pada tiga sumbu dalam satuan g sekitar 9,8 meter per detik kuadrat'
            }
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#0284C7"
              importantForAccessibility="no"
            />
            <Text style={styles.infoBoxText} importantForAccessibility="no">
              Accelerometer mengukur percepatan linear perangkat pada tiga sumbu dalam satuan{' '}
              <Text style={styles.infoBoxBold}>g</Text> (≈ 9,8 m/s²). Saat perangkat diam dan
              rata, sumbu Z ≈ 1 g (gravitasi bumi).
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─── Sub-komponen: Header ─────────────────────────────────────────────────────

function PageHeader({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <View style={styles.pageHeader}>
      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Kembali ke halaman sebelumnya"
        accessibilityHint="Navigasi kembali ke halaman Profil"
      >
        <Ionicons name="arrow-back" size={22} color="#0F172A" importantForAccessibility="no" />
      </Pressable>
      <View style={styles.headerTitleWrapper}>
        <Text style={styles.pageTitle}>Sensor Gerak</Text>
        <Text style={styles.pageSubtitle}>Accelerometer perangkat</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },

  // Header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrapper: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },

  // Status Card
  statusCard: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  statusCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  statusCardIdle: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotActive: {
    backgroundColor: '#22C55E',
  },
  statusDotIdle: {
    backgroundColor: '#94A3B8',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextIdle: {
    color: '#64748B',
  },
  statusDesc: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 18,
  },

  // Data Card
  dataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  dataCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  axisGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  axisCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  axisCardX: { backgroundColor: '#EFF6FF' },
  axisCardY: { backgroundColor: '#F0FDFA' },
  axisCardZ: { backgroundColor: '#FFF7ED' },
  axisLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  axisValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  axisDesc: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
  magnitudeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  magnitudeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  magnitudeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F766E',
  },

  // Toggle Button
  toggleButton: {
    minHeight: 52,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleButtonStart: {
    backgroundColor: '#0F766E',
    shadowColor: '#0F766E',
  },
  toggleButtonStop: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Settings Button (izin ditolak)
  settingsButton: {
    minHeight: 52,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0F766E',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 14,
    alignItems: 'flex-start',
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  infoBoxBold: {
    fontWeight: '700',
  },

  // Feedback (sensor unavailable / permission denied)
  feedbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  feedbackSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Shared
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
