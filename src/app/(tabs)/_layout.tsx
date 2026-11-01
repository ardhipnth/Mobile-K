import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Menggunakan custom BottomNav terpadu yang memenuhi aturan aksesibilitas 44x44
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
        }}
      />
      <Tabs.Screen
        name="sensor"
        options={{
          title: 'Sensor Gerak',
          // Disembunyikan dari tab bar bawaan karena navigasi ditangani via Profil
          href: null,
        }}
      />
    </Tabs>
  );
}
