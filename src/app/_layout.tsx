/**
 * Root Layout — KampusMarket
 *
 * Membungkus seluruh app dengan AuthProvider agar state autentikasi
 * tersedia di semua layar. Redireksi otomatis:
 *  - Jika belum login → arahkan ke /(auth)/login
 *  - Jika sudah login  → arahkan ke /(tabs)
 *
 * Selama sesi sedang dimuat dari AsyncStorage, tampilkan layar
 * loading sederhana agar tidak ada flash ke halaman yang salah.
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/AuthContext';

// ─── Guard: Redirect berdasarkan status autentikasi ───────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Tunggu sampai sesi selesai dimuat
    if (isLoading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Belum login, arahkan ke Login
      router.replace('/(auth)/login' as any);
    } else if (isAuthenticated && inAuthGroup) {
      // Sudah login tapi masih di halaman auth, arahkan ke Home
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, isLoading, segments]);

  // Tampilan loading saat sesi sedang dicek
  if (isLoading) {
    return (
      <View style={loadingStyles.container} accessibilityLabel="Memuat aplikasi" accessibilityRole="progressbar">
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  return <>{children}</>;
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
  },
});

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </AuthGuard>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
