/**
 * Halaman Profil KampusMarket
 *
 * Menampilkan informasi akun pengguna yang login:
 *  - Avatar inisial (huruf pertama nama)
 *  - Nama lengkap dan email
 *  - Status verifikasi NIM
 *  - Tombol Logout dengan konfirmasi
 *
 * Aksesibilitas: setiap elemen interaktif punya accessibilityLabel,
 *   accessibilityRole, dan accessibilityHint. Tap target minimal 44x44.
 * Keamanan: token tidak ditampilkan di layar maupun console.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { BottomNav, TabKey } from '@/components/BottomNav';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabKey>('profil');

  // Ambil inisial nama (maks 2 huruf) untuk avatar
  const initials = (user?.name ?? 'M')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  // ── Handler Logout ─────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Keluar Akun',
      'Apakah kamu yakin ingin keluar dari KampusMarket?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              // Navigasi ke login setelah state direset
              router.replace('/(auth)/login' as any);
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
    );
  };

  // ── Handler Tab Navigasi ───────────────────────────────────────────────────
  const handleTabPress = (tab: TabKey) => {
    setCurrentTab(tab);
    if (tab === 'beranda') {
      router.replace('/(tabs)' as any);
    } else if (tab !== 'profil') {
      Alert.alert('Navigasi', `Membuka tab ${tab.toUpperCase()}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.screenContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header Halaman ─────────────────────────────────────────────── */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Profil Saya</Text>
            <Text style={styles.pageSubtitle}>Informasi akun KampusMarket</Text>
          </View>

          {/* ── Kartu Avatar & Nama ────────────────────────────────────────── */}
          <View
            style={styles.profileCard}
            accessibilityRole="summary"
            accessibilityLabel={`Profil: ${user?.name ?? 'Mahasiswa'}, ${user?.email ?? ''}`}
          >
            {/* Avatar Inisial */}
            <View
              style={styles.avatarCircle}
              importantForAccessibility="no"
            >
              <Text style={styles.avatarText} importantForAccessibility="no">
                {initials || 'M'}
              </Text>
            </View>

            {/* Nama & Email */}
            <Text style={styles.userName}>
              {user?.name ?? 'Mahasiswa'}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email ?? 'email@kampus.ac.id'}
            </Text>

            {/* Badge NIM Terverifikasi */}
            <View
              style={styles.nimBadge}
              accessibilityRole="text"
              accessibilityLabel={
                user?.nim
                  ? `NIM terverifikasi: ${user.nim}`
                  : 'Mahasiswa Aktif Terverifikasi'
              }
            >
              <Ionicons
                name="shield-checkmark"
                size={14}
                color="#0F766E"
                importantForAccessibility="no"
              />
              <Text style={styles.nimBadgeText} importantForAccessibility="no">
                {user?.nim ? `NIM ${user.nim} · Terverifikasi` : 'Mahasiswa Aktif · Terverifikasi'}
              </Text>
            </View>
          </View>

          {/* ── Informasi Akun (Detail Row) ────────────────────────────────── */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Informasi Akun</Text>

            {/* Baris Nama */}
            <View
              style={styles.infoRow}
              accessibilityRole="text"
              accessibilityLabel={`Nama lengkap: ${user?.name ?? '-'}`}
            >
              <View style={styles.infoIconWrapper} importantForAccessibility="no">
                <Ionicons name="person-outline" size={18} color="#0F766E" importantForAccessibility="no" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel} importantForAccessibility="no">Nama Lengkap</Text>
                <Text style={styles.infoValue} importantForAccessibility="no">
                  {user?.name ?? '-'}
                </Text>
              </View>
            </View>

            {/* Baris Email */}
            <View
              style={styles.infoRow}
              accessibilityRole="text"
              accessibilityLabel={`Email: ${user?.email ?? '-'}`}
            >
              <View style={styles.infoIconWrapper} importantForAccessibility="no">
                <Ionicons name="mail-outline" size={18} color="#0F766E" importantForAccessibility="no" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel} importantForAccessibility="no">Email</Text>
                <Text style={styles.infoValue} importantForAccessibility="no">
                  {user?.email ?? '-'}
                </Text>
              </View>
            </View>

            {/* Baris NIM */}
            <View
              style={[styles.infoRow, styles.infoRowLast]}
              accessibilityRole="text"
              accessibilityLabel={`NIM: ${user?.nim ?? '-'}`}
            >
              <View style={styles.infoIconWrapper} importantForAccessibility="no">
                <Ionicons name="card-outline" size={18} color="#0F766E" importantForAccessibility="no" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel} importantForAccessibility="no">NIM</Text>
                <Text style={styles.infoValue} importantForAccessibility="no">
                  {user?.nim ?? '-'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Tombol Logout ──────────────────────────────────────────────── */}
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.buttonPressed,
              isLoggingOut && styles.buttonDisabled,
            ]}
            onPress={handleLogout}
            disabled={isLoggingOut}
            accessibilityRole="button"
            accessibilityLabel="Keluar dari KampusMarket"
            accessibilityHint="Ketuk untuk keluar dari akun dan kembali ke halaman login"
            accessibilityState={{ disabled: isLoggingOut, busy: isLoggingOut }}
          >
            {isLoggingOut ? (
              <ActivityIndicator color="#DC2626" size="small" />
            ) : (
              <>
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color="#DC2626"
                  importantForAccessibility="no"
                />
                <Text style={styles.logoutButtonText} importantForAccessibility="no">
                  Keluar dari Akun
                </Text>
              </>
            )}
          </Pressable>

          {/* Catatan Keamanan */}
          <Text style={styles.securityNote}>
            Sesi kamu aman dan terenkripsi. Token tidak pernah disimpan di tempat yang tidak aman.
          </Text>
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={currentTab}
          onTabPress={handleTabPress}
        />
      </View>
    </SafeAreaView>
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
    paddingBottom: 24,
  },

  // Header Halaman
  pageHeader: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  // Kartu Profil
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: '#99F6E4',
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F766E',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 14,
    textAlign: 'center',
  },
  nimBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  nimBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },

  // Seksi Informasi Akun
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    minHeight: 56,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },

  // Tombol Logout
  logoutButton: {
    minHeight: 52,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    marginBottom: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Catatan Keamanan
  securityNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
