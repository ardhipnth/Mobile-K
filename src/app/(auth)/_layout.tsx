/**
 * Layout untuk grup rute autentikasi (auth).
 * Stack navigator dengan header disembunyikan karena setiap
 * halaman memiliki header kustom sendiri.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
