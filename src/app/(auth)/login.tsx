/**
 * Halaman Login KampusMarket
 *
 * Field  : NIM (angka saja) dan Password
 * Validasi lokal sebelum request:
 *  - Input kosong ditolak
 *  - NIM hanya angka
 *  - Password minimal 8 karakter
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

interface LoginErrors {
  nim?: string;
  password?: string;
  form?: string;
}

function validate(nim: string, password: string): LoginErrors {
  const errors: LoginErrors = {};

  if (!nim.trim()) {
    errors.nim = 'NIM wajib diisi.';
  } else if (!/^\d+$/.test(nim)) {
    errors.nim = 'NIM hanya boleh berisi angka.';
  }

  if (!password) {
    errors.password = 'Password wajib diisi.';
  } else if (password.length < 8) {
    errors.password = 'Password minimal 8 karakter.';
  }

  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // 1. Validasi lokal
    const localErrors = validate(nim, password);
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }
    setErrors({});

    // 2. Panggil AuthContext
    setIsLoading(true);
    try {
      const result = await login(nim, password);
      if (result.success) {
        // Navigasi ke Home — replace agar tombol back tidak kembali ke Login
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
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header Brand ───────────────────────────────────── */}
          <View style={styles.brandSection}>
            <View style={styles.brandIconWrapper}>
              <Ionicons name="school" size={32} color="#0F766E" />
            </View>
            <Text style={styles.brandName}>KampusMarket</Text>
            <Text style={styles.brandTagline}>Pasar Mahasiswa Satu Kampus</Text>
          </View>

          {/* ── Card Form ──────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Masuk ke Akunmu</Text>
            <Text style={styles.cardSubtitle}>
              Gunakan NIM dan password yang terdaftar untuk melanjutkan.
            </Text>

            {/* Error level form */}
            {errors.form && (
              <View
                style={styles.formErrorBanner}
                accessibilityRole="alert"
                accessibilityLabel={`Gagal masuk: ${errors.form}`}
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

            {/* NIM */}
            <AuthInput
              label="NIM (Nomor Induk Mahasiswa)"
              placeholder="Contoh: 2021001234"
              value={nim}
              onChangeText={(t) => {
                setNim(t);
                if (errors.nim) setErrors((e) => ({ ...e, nim: undefined }));
                if (errors.form) setErrors((e) => ({ ...e, form: undefined }));
              }}
              error={errors.nim}
              iconName="card-outline"
              keyboardType="numeric"
              returnKeyType="next"
              accessibilityLabel="Nomor Induk Mahasiswa"
              accessibilityHint="Masukkan NIM kamu, hanya angka, tanpa spasi atau tanda baca"
              maxLength={20}
            />

            {/* Password */}
            <AuthInput
              label="Password"
              placeholder="Masukkan password kamu"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                if (errors.form) setErrors((e) => ({ ...e, form: undefined }));
              }}
              error={errors.password}
              isPassword
              iconName="lock-closed-outline"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Password akun"
              accessibilityHint="Masukkan password minimal 8 karakter"
            />

            {/* Tombol Login */}
            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.buttonPressed,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Masuk ke KampusMarket"
              accessibilityHint="Ketuk untuk masuk menggunakan NIM dan password yang telah diisi"
              accessibilityState={{ disabled: isLoading, busy: isLoading }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="log-in-outline"
                    size={20}
                    color="#FFFFFF"
                    importantForAccessibility="no"
                  />
                  <Text style={styles.loginButtonText} importantForAccessibility="no">
                    Masuk
                  </Text>
                </>
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.divider} accessibilityRole="none">
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>atau</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Navigasi ke Register */}
            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push('/(auth)/register' as any)}
              accessibilityRole="button"
              accessibilityLabel="Daftar akun baru KampusMarket"
              accessibilityHint="Navigasi ke halaman pendaftaran akun untuk mahasiswa baru"
            >
              <Ionicons
                name="person-add-outline"
                size={18}
                color="#0F766E"
                importantForAccessibility="no"
              />
              <Text style={styles.registerButtonText} importantForAccessibility="no">
                Belum punya akun? Daftar Sekarang
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <Text style={styles.footerNote}>
            Hanya untuk mahasiswa aktif yang terverifikasi NIM.
          </Text>
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
    paddingTop: 32,
    paddingBottom: 32,
    justifyContent: 'center',
  },

  // Brand Section
  brandSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    marginTop: 2,
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
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 20,
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

  // Login Button
  loginButton: {
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
  loginButtonText: {
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

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Register Button
  registerButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#0F766E',
    backgroundColor: '#F0FDFA',
  },
  registerButtonText: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '700',
  },

  // Footer
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 24,
    paddingHorizontal: 16,
  },
});
