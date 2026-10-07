import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  FlatList,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProductCard, ProductItem } from '@/components/ProductCard';
import { BottomNav, TabKey } from '@/components/BottomNav';

// Interface untuk Kategori Fakultas
interface FacultyCategory {
  id: string;
  name: string;
  shortName: string;
  icon: keyof typeof Ionicons.glyphMap;
  itemCount: number;
  badgeBg: string;
  iconColor: string;
}

// Data Dummy Kategori per Fakultas
const FACULTY_CATEGORIES: FacultyCategory[] = [
  {
    id: 'fasilkom',
    name: 'Ilmu Komputer',
    shortName: 'FASILKOM',
    icon: 'laptop-outline',
    itemCount: 42,
    badgeBg: '#E0F2FE',
    iconColor: '#0284C7',
  },
  {
    id: 'ft',
    name: 'Teknik',
    shortName: 'FT',
    icon: 'build-outline',
    itemCount: 38,
    badgeBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    id: 'fk',
    name: 'Kedokteran',
    shortName: 'FK',
    icon: 'medkit-outline',
    itemCount: 19,
    badgeBg: '#FEE2E2',
    iconColor: '#DC2626',
  },
  {
    id: 'feb',
    name: 'Ekonomi & Bisnis',
    shortName: 'FEB',
    icon: 'bar-chart-outline',
    itemCount: 54,
    badgeBg: '#ECFDF5',
    iconColor: '#059669',
  },
  {
    id: 'fmipa',
    name: 'MIPA & Sains',
    shortName: 'FMIPA',
    icon: 'flask-outline',
    itemCount: 27,
    badgeBg: '#F3E8FF',
    iconColor: '#7C3AED',
  },
  {
    id: 'fh',
    name: 'Hukum',
    shortName: 'FH',
    icon: 'scale-outline',
    itemCount: 15,
    badgeBg: '#FFEDD5',
    iconColor: '#C2410C',
  },
  {
    id: 'fsrd',
    name: 'Seni & Desain',
    shortName: 'FSRD',
    icon: 'color-palette-outline',
    itemCount: 23,
    badgeBg: '#FCE7F3',
    iconColor: '#DB2777',
  },
];

// Data Dummy Barang Terbaru Mahasiswa
const DUMMY_PRODUCTS: ProductItem[] = [
  {
    id: 'p1',
    title: 'Kalkulator Saintifik Casio fx-991EX ClassWiz',
    price: 185000,
    faculty: 'Fakultas Teknik',
    condition: 'Mulus 95%',
    location: 'Gedung FT Elektro',
    sellerName: 'Dimas Pratama',
    imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80',
    isNIMVerified: true,
  },
  {
    id: 'p2',
    title: 'Jas Laboratorium Kimia Size L + Kacamata Google',
    price: 65000,
    faculty: 'FMIPA',
    condition: 'Baru 1 Semester',
    location: 'Lab Dasar FMIPA',
    sellerName: 'Siti Nurhaliza',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80',
    isNIMVerified: true,
  },
  {
    id: 'p3',
    title: 'Buku Kalkulus Edisi 9 Jilid 1 (Dale Varberg & Purcell)',
    price: 85000,
    faculty: 'MIPA / Teknik',
    condition: 'Catatan Rapi',
    location: 'Perpustakaan Pusat',
    sellerName: 'Arya Wiguna',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    isNIMVerified: true,
  },
  {
    id: 'p4',
    title: 'iPad 9th Gen 64GB WiFi Gray + Apple Pencil Ori',
    price: 3750000,
    faculty: 'FASILKOM',
    condition: 'Bekas Skripsi',
    location: 'Kantin Gedung C',
    sellerName: 'Budi Santoso',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
    isNIMVerified: true,
  },
  {
    id: 'p5',
    title: 'Monitor Portable 15.6 Inch Full HD IPS Type-C',
    price: 890000,
    faculty: 'FASILKOM',
    condition: 'Normal 100%',
    location: 'Asrama Mahasiswa',
    sellerName: 'Nabila Rahma',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
    isNIMVerified: true,
  },
  {
    id: 'p6',
    title: 'Sepeda Lipat Polygon Urbano Siap Pakai Kampus',
    price: 900000,
    faculty: 'Umum Kampus',
    condition: 'Ban & Rem Baru',
    location: 'Parkiran Rektorat',
    sellerName: 'Kevin Alamsyah',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
    isNIMVerified: true,
  },
  {
    id: 'p7',
    title: 'Meja Lipat Belajar Kayu Lesehan untuk Kamar Kos',
    price: 45000,
    faculty: 'FSRD',
    condition: 'Kokoh & Bersih',
    location: 'Kantin Belakang',
    sellerName: 'Rian Hidayat',
    imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop&q=80',
    isNIMVerified: false,
  },
  {
    id: 'p8',
    title: 'Buku Pengantar Akuntansi IFRS Edisi 4 - Weygandt',
    price: 75000,
    faculty: 'FEB',
    condition: 'Mulus 90%',
    location: 'Gazebo FEB',
    sellerName: 'Zahra Amalia',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    isNIMVerified: true,
  },
];

export default function HomeScreen() {
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabKey>('beranda');

  // Handler interaksi
  const handleSearchPress = () => {
    Alert.alert('Cari Barang', 'Fitur pencarian barang bekas kampus.');
  };

  const handleSellPress = () => {
    Alert.alert('Jual Barang', 'Formulir unggah barang bekas khusus mahasiswa.');
  };

  const handleCategoryPress = (category: FacultyCategory) => {
    setSelectedFaculty((prev) => (prev === category.id ? null : category.id));
  };

  const handleProductPress = (product: ProductItem) => {
    Alert.alert(
      product.title,
      `Harga: Rp ${product.price.toLocaleString('id-ID')}\nLokasi: ${product.location}\nPenjual: ${product.sellerName}`
    );
  };

  // Filter produk berdasarkan fakultas jika dipilih
  const filteredProducts = selectedFaculty
    ? DUMMY_PRODUCTS.filter(
        (p) =>
          p.faculty.toLowerCase().includes(selectedFaculty) ||
          (selectedFaculty === 'fasilkom' && p.faculty.toLowerCase().includes('fasilkom')) ||
          (selectedFaculty === 'ft' && p.faculty.toLowerCase().includes('teknik')) ||
          (selectedFaculty === 'fmipa' && p.faculty.toLowerCase().includes('mipa'))
      )
    : DUMMY_PRODUCTS;

  // Komponen Header dan Bagian Atas FlatList
  const renderListHeader = () => (
    <View style={styles.headerContentWrapper}>
      {/* 1. Header: Nama App + Ikon Cari */}
      <View style={styles.appHeader}>
        <View style={styles.brandContainer}>
          <View style={styles.brandIconWrapper}>
            <Ionicons name="school" size={22} color="#0F766E" />
          </View>
          <View>
            <Text style={styles.appName}>KampusMarket</Text>
            <Text style={styles.appTagline}>Pasar Mahasiswa Satu Kampus</Text>
          </View>
        </View>

        {/* Ikon Cari (Min 44x44 tap target & aksesibilitas lengkap) */}
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleSearchPress}
          accessibilityRole="button"
          accessibilityLabel="Cari barang bekas"
          accessibilityHint="Membuka halaman pencarian barang berdasarkan nama atau kategori"
        >
          <Ionicons name="search" size={22} color="#0F172A" />
        </Pressable>
      </View>

      {/* 2. Judul Sambutan & 3. Teks Informasi Singkat */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Halo, Rekan Mahasiswa! 👋</Text>
        <Text style={styles.infoText}>
          Temukan dan jual barang bekas kebutuhan kuliah secara aman antar teman satu almamater.
        </Text>

        {/* NIM Verified Badge Info */}
        <View
          style={styles.nimNoticeBadge}
          accessibilityRole="text"
          accessibilityLabel="Khusus Mahasiswa Aktif Terverifikasi NIM Kampus"
        >
          <Ionicons
            name="shield-checkmark"
            size={16}
            color="#0F766E"
            importantForAccessibility="no"
          />
          <Text style={styles.nimNoticeText} importantForAccessibility="no">
            Khusus Mahasiswa Aktif Terverifikasi NIM Kampus
          </Text>
        </View>
      </View>

      {/* 4. Banner Gambar */}
      <View style={styles.bannerContainer}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
          }}
          style={styles.bannerImage}
          resizeMode="cover"
          accessibilityLabel="Banner Bursa Buku dan Alat Kuliah Semester Baru"
        />
        {/* Overlay Banner */}
        <View style={styles.bannerOverlay}>
          <View style={styles.bannerPill}>
            <Text style={styles.bannerPillText}>HEMAT AWAL SEMESTER</Text>
          </View>
          <Text style={styles.bannerHeading}>Bursa Buku & Alat Praktikum</Text>
          <Text style={styles.bannerSubtitle}>
            Hemat hingga 70% dari harga baru. COD langsung di koridor kampus!
          </Text>
        </View>
      </View>

      {/* 5. Tombol "Jual Barang" (CTA Utama) */}
      <Pressable
        style={({ pressed }) => [
          styles.ctaButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSellPress}
        accessibilityRole="button"
        accessibilityLabel="Jual Barang Sekarang"
        accessibilityHint="Navigasi ke formulir untuk mengunggah iklan barang bekas Anda"
      >
        <Ionicons name="add-circle" size={24} color="#FFFFFF" importantForAccessibility="no" />
        <Text style={styles.ctaButtonText} importantForAccessibility="no">Jual Barang Sekarang</Text>
      </Pressable>

      {/* 6. Section "Kategori per Fakultas" (Kartu Horizontal) */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Kategori per Fakultas</Text>
            <Text style={styles.sectionSubtitle}>
              Cari perlengkapan spesifik sesuai jurusannmu
            </Text>
          </View>

          {selectedFaculty && (
            <Pressable
              style={styles.resetFilterButton}
              onPress={() => setSelectedFaculty(null)}
              accessibilityRole="button"
              accessibilityLabel="Reset filter fakultas, lihat semua barang"
              accessibilityHint="Menghapus filter fakultas dan menampilkan semua barang dari seluruh fakultas"
            >
              <Text style={styles.resetFilterText} importantForAccessibility="no">Lihat Semua</Text>
            </Pressable>
          )}
        </View>

        {/* Daftar Kartu Horizontal */}
        <FlatList
          horizontal
          data={FACULTY_CATEGORIES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryListContent}
          renderItem={({ item }) => {
            const isSelected = selectedFaculty === item.id;
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => handleCategoryPress(item)}
                accessibilityRole="button"
                accessibilityLabel={`Kategori ${item.name}, ${item.itemCount} barang tersedia`}
                accessibilityHint={
                  isSelected
                    ? `Ketuk untuk menghapus filter ${item.name}`
                    : `Ketuk untuk menyaring barang bekas khusus ${item.name}`
                }
                accessibilityState={{ selected: isSelected }}
              >
                <View
                  style={[
                    styles.categoryIconCircle,
                    { backgroundColor: item.badgeBg },
                    isSelected && { backgroundColor: '#0F766E' },
                  ]}
                  importantForAccessibility="no"
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={isSelected ? '#FFFFFF' : item.iconColor}
                    importantForAccessibility="no"
                  />
                </View>
                <Text
                  style={[
                    styles.categoryShortName,
                    isSelected && styles.categoryTextSelected,
                  ]}
                  numberOfLines={1}
                  importantForAccessibility="no"
                >
                  {item.shortName}
                </Text>
                <Text
                  style={[
                    styles.categoryFullName,
                    isSelected && styles.categoryTextSelected,
                  ]}
                  numberOfLines={1}
                  importantForAccessibility="no"
                >
                  {item.name}
                </Text>
                <Text style={styles.categoryCount} importantForAccessibility="no">{item.itemCount} item</Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Header Section 7: Barang Terbaru */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Barang Terbaru di Kampus</Text>
            <Text style={styles.sectionSubtitle}>
              Unggahan paling anyar dari mahasiswa sekitarmu
            </Text>
          </View>
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountText}>
              {filteredProducts.length} Barang
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Screen Wrapper */}
      <View style={styles.screenContainer}>
        {/* Section 7: Barang Terbaru (FlatList dengan ProductCard) */}
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={handleProductPress} />
          )}
          ListEmptyComponent={
            <View
              style={styles.emptyContainer}
              accessibilityRole="text"
              accessibilityLabel="Belum Ada Barang. Tidak ada barang bekas di kategori fakultas ini saat ini."
            >
              <Ionicons name="file-tray-outline" size={48} color="#94A3B8" importantForAccessibility="no" />
              <Text style={styles.emptyTitle} importantForAccessibility="no">Belum Ada Barang</Text>
              <Text style={styles.emptySubtitle} importantForAccessibility="no">
                Tidak ada barang bekas di kategori fakultas ini saat ini.
              </Text>
            </View>
          }
        />

        {/* 8. Bottom Navigation: Beranda, Kategori, Jual, Chat, Profil */}
        <BottomNav
          activeTab={currentTab}
          onTabPress={(tab) => {
            setCurrentTab(tab);
            if (tab === 'jual') {
              handleSellPress();
            } else if (tab !== 'beranda') {
              Alert.alert('Navigasi', `Membuka tab ${tab.toUpperCase()}`);
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  headerContentWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // 1. Header Styles
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F766E', // Academic Teal
    letterSpacing: -0.3,
  },
  appTagline: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
  },
  iconButton: {
    width: 44,
    height: 44, // Minimum 44x44 tap target
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

  // 2 & 3. Welcome & Info
  welcomeSection: {
    marginTop: 6,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A', // Kontras tinggi WCAG AAA
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 10,
  },
  nimNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  nimNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F766E',
  },

  // 4. Banner Gambar
  bannerContainer: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    backgroundColor: '#0F172A',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    opacity: 0.55,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    padding: 16,
    justifyContent: 'center',
  },
  bannerPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  bannerPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  bannerHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#F1F5F9',
    lineHeight: 16,
  },

  // 5. Tombol "Jual Barang"
  ctaButton: {
    minHeight: 48, // Memenuhi minimum 44px
    minWidth: 44,
    backgroundColor: '#0F766E',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 24,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // 6. Section Styles
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  resetFilterButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  itemCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },

  // Kategori Cards Horizontal
  categoryListContent: {
    paddingRight: 16,
    gap: 10,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    minWidth: 105,
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryCardSelected: {
    backgroundColor: '#CCFBF1',
    borderColor: '#0F766E',
    borderWidth: 1.5,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryShortName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  categoryFullName: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 1,
  },
  categoryCount: {
    fontSize: 10,
    color: '#0F766E', // #0F766E on white = 4.85:1 kontras (WCAG AA)
    fontWeight: '700',
    marginTop: 4,
  },
  categoryTextSelected: {
    color: '#0F766E',
  },

  // 7. Grid Produk
  productRow: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});
