/**
 * Halaman Register KampusMarket
 *
 * Field  : Nama Lengkap, NIM, Email, Password, Konfirmasi Password
 * Validasi lokal:
 *  - Semua field wajib diisi
 *  - NIM hanya angka
 *  - Email format valid
 *  - Password minimal 8 karakter
 *  - Konfirmasi password harus cocok
 * Aksesibilitas: setiap elemen interaktif punya accessibilityLabel,
 *   accessibilityRole, dan accessibilityHint.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { AuthInput } from '@/components/AuthInput';

// ─── Validasi ─────────────────────────────────────────────────────────────────

interface RegisterErrors {
  name?: string;
  nim?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(
  name: string,
  nim: string,
  email: string,
  password: string,
  confirmPassword: string
): RegisterErrors {
  const errors: RegisterErrors = {};

  if (!name.trim()) {
    errors.name = 'Nama lengkap wajib diisi.';
  } else if (name.trim().length < 3) {
    errors.name = 'Nama lengkap minimal 3 karakter.';
  }

  if (!nim.trim()) {
    errors.nim = 'NIM wajib diisi.';
  } else if (!/^\d+$/.test(nim)) {
    errors.nim = 'NIM hanya boleh berisi angka.';
  } else if (nim.length < 6) {
    errors.nim = 'NIM minimal 6 digit.';
  }

  if (!email.trim()) {
    errors.email = 'Email wajib diisi.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Format email tidak valid. Contoh: nama@kampus.ac.id';
  }

  if (!password) {
    errors.password = 'Password wajib diisi.';
  } else if (password.length < 8) {
    errors.password = 'Password minimal 8 karakter.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password wajib diisi.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password tidak cocok dengan password.';
  }

  return errors;
}

// ─── Komponen Indikator Kekuatan Password ─────────────────────────────────────

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;

  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const labels = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
  const colors = ['', '#EF4444', '#F59E0B', '#10B981', '#0F766E'];
  const label = labels[strength];
  const color = colors[strength];

  return (
    <View
      style={strengthStyles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={`Kekuatan password: ${label}`}
      accessibilityValue={{ min: 0, max: 4, now: strength }}
    >
      <View style={strengthStyles.barRow}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              strengthStyles.segment,
              { backgroundColor: i <= strength ? color : '#E2E8F0' },
            ]}
          />
        ))}
      </View>
      <Text style={[strengthStyles.label, { color }]} importantForAccessibility="no">
        {label}
      </Text>
    </View>
  );
}

const strengthStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -8,
    marginBottom: 16,
  },
  barRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 70,
    textAlign: 'right',
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [nim, setNim] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const clearFieldError = (field: keyof RegisterErrors) => {
    if (errors[field] || errors.form) {
      setErrors((e) => ({ ...e, [field]: undefined, form: undefined }));
    }
  };

  const handleRegister = async () => {
    // 1. Validasi lokal
    const localErrors = validate(name, nim, email, password, confirmPassword);
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }
    setErrors({});

    // 2. Panggil AuthContext
    setIsLoading(true);
    try {
      const result = await register({ name, nim, email, password });
      if (result.success) {
        router.replace('/(tabs)' as any);
      } else {
        setErrors({ form: result.error });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDFA" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Kembali ke halaman login"
              accessibilityHint="Navigasi kembali ke halaman masuk akun"
            >
              <Ionicons name="arrow-back" size={22} color="#0F172A" importantForAccessibility="no" />
            </Pressable>

            <View style={styles.headerBrand}>
              <View style={styles.brandIconSmall}>
                <Ionicons name="school" size={20} color="#0F766E" />
              </View>
              <Text style={styles.brandName}>KampusMarket</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          {/* ── Card Form ──────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.titleIconWrapper}>
                <Ionicons name="person-add" size={20} color="#0F766E" importantForAccessibility="no" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Daftar Akun Baru</Text>
                <Text style={styles.cardSubtitle}>
                  Khusus mahasiswa aktif berverifikasi NIM
                </Text>
              </View>
            </View>

            {/* Error level form */}
            {errors.form && (
              <View
                style={styles.formErrorBanner}
                accessibilityRole="alert"
                accessibilityLabel={`Gagal mendaftar: ${errors.form}`}
              >
                <Ionicons
                  name="warning"
                  size={16}
                  color="#B91C1C"
                  importantForAccessibility="no"
                />
                <Text style={styles.formErrorText} importantForAccessibility="no">
                  {errors.form}
                </Text>
              </View>
            )}

            {/* Nama Lengkap */}
            <AuthInput
              label="Nama Lengkap"
              placeholder="Contoh: Budi Santoso"
              value={name}
              onChangeText={(t) => { setName(t); clearFieldError('name'); }}
              error={errors.name}
              iconName="person-outline"
              autoCapitalize="words"
              returnKeyType="next"
              accessibilityLabel="Nama lengkap"
              accessibilityHint="Masukkan nama lengkap kamu sesuai kartu mahasiswa"
            />

            {/* NIM */}
            <AuthInput
              label="NIM (Nomor Induk Mahasiswa)"
              placeholder="Contoh: 2021001234"
              value={nim}
              onChangeText={(t) => { setNim(t); clearFieldError('nim'); }}
              error={errors.nim}
              iconName="card-outline"
              keyboardType="numeric"
              returnKeyType="next"
              accessibilityLabel="Nomor Induk Mahasiswa"
              accessibilityHint="Masukkan NIM kamu, hanya angka tanpa spasi"
              maxLength={20}
            />

            {/* Email */}
            <AuthInput
              label="Email Kampus / Pribadi"
              placeholder="nama@kampus.ac.id"
              value={email}
              onChangeText={(t) => { setEmail(t); clearFieldError('email'); }}
              error={errors.email}
              iconName="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              accessibilityLabel="Alamat email"
              accessibilityHint="Masukkan alamat email aktif untuk verifikasi akun"
            />

            {/* Password */}
            <AuthInput
              label="Password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChangeText={(t) => { setPassword(t); clearFieldError('password'); }}
              error={errors.password}
              isPassword
              iconName="lock-closed-outline"
              returnKeyType="next"
              accessibilityLabel="Password akun baru"
              accessibilityHint="Masukkan password minimal 8 karakter untuk amankan akun"
            />

            {/* Indikator Kekuatan Password */}
            <PasswordStrengthBar password={password} />

            {/* Konfirmasi Password */}
            <AuthInput
              label="Konfirmasi Password"
              placeholder="Ulangi password kamu"
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); clearFieldError('confirmPassword'); }}
              error={errors.confirmPassword}
              isPassword
              iconName="shield-checkmark-outline"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              accessibilityLabel="Konfirmasi password"
              accessibilityHint="Masukkan ulang password yang sama untuk konfirmasi"
            />

            {/* Tombol Daftar */}
            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                pressed && styles.buttonPressed,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Daftar dan buat akun KampusMarket"
              accessibilityHint="Ketuk untuk membuat akun baru dengan data yang telah diisi"
              accessibilityState={{ disabled: isLoading, busy: isLoading }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="person-add-outline"
                    size={20}
                    color="#FFFFFF"
                    importantForAccessibility="no"
                  />
                  <Text style={styles.registerButtonText} importantForAccessibility="no">
                    Buat Akun
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Navigasi ke Login */}
          <View style={styles.loginLinkRow}>
            <Text style={styles.loginLinkLabel}>Sudah punya akun?</Text>
            <Pressable
              style={({ pressed }) => [styles.loginLinkButton, pressed && styles.linkPressed]}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Masuk ke akun yang sudah ada"
              accessibilityHint="Navigasi ke halaman login untuk masuk dengan akun yang sudah terdaftar"
            >
              <Text style={styles.loginLinkText}>Masuk Sekarang</Text>
            </Pressable>
          </View>

          {/* NIM Badge Notice */}
          <View
            style={styles.nimNotice}
            accessibilityRole="text"
            accessibilityLabel="Pastikan NIM yang kamu daftarkan adalah NIM aktif dari kampus kamu"
          >
            <Ionicons
              name="information-circle-outline"
              size={14}
              color="#0F766E"
              importantForAccessibility="no"
            />
            <Text style={styles.nimNoticeText} importantForAccessibility="no">
              Pastikan NIM adalah NIM aktif dari kampus kamu.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0FDFA',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F766E',
  },
  headerSpacer: {
    width: 44,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  titleIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },

  // Form Error Banner
  formErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  formErrorText: {
    fontSize: 13,
    color: '#B91C1C',
    flex: 1,
    lineHeight: 18,
  },

  // Register Button
  registerButton: {
    minHeight: 50,
    backgroundColor: '#0F766E',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  // Login Link
  loginLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  loginLinkLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  loginLinkButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  loginLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  linkPressed: {
    opacity: 0.7,
  },

  // NIM Notice
  nimNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 16,
  },
  nimNoticeText: {
    fontSize: 11,
    color: '#0F766E',
    textAlign: 'center',
  },
});
