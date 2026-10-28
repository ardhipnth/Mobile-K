import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  FlatList,
  StatusBar,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ProductCard, ProductItem } from '@/components/ProductCard';
import { BottomNav, TabKey } from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { getProducts } from '@/services/productService';
import { Product } from '@/types/product';
<<<<<<< Updated upstream
=======
import { ApiError, ApiErrorKind } from '@/utils/apiError';

export type RequestStatus = 'loading' | 'success' | 'error' | 'empty';

>>>>>>> Stashed changes

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



export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabKey>('beranda');

  // ── State data produk dari API ──────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
<<<<<<< Updated upstream
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
=======
  const [status, setStatus] = useState<RequestStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorKind, setErrorKind] = useState<ApiErrorKind | undefined>(undefined);
>>>>>>> Stashed changes

  // Dimensi jendela untuk tata letak responsif tanpa hardcode lebar piksel
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Menentukan jumlah kolom secara responsif:
  // - HP mode portrait (< 600px): 2 kolom
  // - Layar sedang (HP mode landscape & tablet portrait, 600px - 899px): 3 kolom
  // - Layar lebar (tablet landscape & desktop, >= 900px): 4 kolom
  const numColumns = useMemo(() => {
    if (width >= 900) return 4;
    if (width >= 600) return 3;
    return 2;
  }, [width]);

  // Padding horizontal responsif agar proporsional di HP maupun layar lebar/tablet
  const horizontalPadding = useMemo(() => {
    if (width >= 900) return 32;
    if (width >= 600) return 24;
    return 16;
  }, [width]);

  // Tinggi banner responsif: lebih ramping di mode landscape HP agar tidak menutupi layar
  const bannerHeight = useMemo(() => {
    if (isLandscape && height < 500) return 120;
    if (width >= 900) return 180;
    return 160;
  }, [isLandscape, height, width]);

  // ── Fetch produk dari API ───────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
<<<<<<< Updated upstream
    setIsLoading(true);
    setError(null);
=======
    setStatus('loading');
    setErrorMessage('');
    setErrorKind(undefined);
>>>>>>> Stashed changes
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
<<<<<<< Updated upstream
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan yang tidak diketahui.'
      );
=======
      setStatus('error');
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
        setErrorKind(err.kind);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Terjadi kesalahan yang tidak diketahui.');
      }
>>>>>>> Stashed changes
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Handler interaksi ──────────────────────────────────────────────────────
  const handleSearchPress = () => {
    Alert.alert('Cari Barang', 'Fitur pencarian barang bekas kampus.');
  };

  const handleSellPress = () => {
    Alert.alert('Jual Barang', 'Formulir unggah barang bekas khusus mahasiswa.');
  };

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
            await logout();
            router.replace('/(auth)/login' as any);
          },
        },
      ]
    );
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

  // Filter produk berdasarkan fakultas jika dipilih (sumber: data dari API)
  const filteredProducts = selectedFaculty
    ? products.filter(
        (p) =>
          p.faculty.toLowerCase().includes(selectedFaculty) ||
          (selectedFaculty === 'fasilkom' && p.faculty.toLowerCase().includes('fasilkom')) ||
          (selectedFaculty === 'ft' && p.faculty.toLowerCase().includes('teknik')) ||
          (selectedFaculty === 'fmipa' && p.faculty.toLowerCase().includes('mipa'))
      )
    : products;

  // Placeholder transparan agar kartu barang pada baris terakhir tidak melar (flex: 1)
  // dan lebarnya tetap konsisten dengan kolom di atasnya
  const paddedProducts = useMemo(() => {
    if (filteredProducts.length === 0) return [];
    const remainder = filteredProducts.length % numColumns;
    if (remainder === 0) return filteredProducts;
    const dummyCount = numColumns - remainder;
    const dummies: ProductItem[] = Array.from({ length: dummyCount }, (_, i) => ({
      id: `__dummy_${i}`,
      title: '',
      price: 0,
      faculty: '',
      condition: '',
      location: '',
      sellerName: '',
      imageUrl: '',
    }));
    return [...filteredProducts, ...dummies];
  }, [filteredProducts, numColumns]);

  // Komponen Header dan Bagian Atas FlatList
  const renderListHeader = () => (
    <View style={[styles.headerContentWrapper, { paddingHorizontal: horizontalPadding }]}>
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

        {/* Ikon Cari + Logout */}
        <View style={styles.headerActions}>
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

          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Keluar dari akun"
            accessibilityHint="Ketuk untuk keluar dari sesi KampusMarket dan kembali ke halaman login"
          >
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          </Pressable>
        </View>
      </View>

      {/* 2. Judul Sambutan & 3. Teks Informasi Singkat */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>
          Halo, {user?.name?.split(' ')[0] ?? 'Mahasiswa'}! 👋
        </Text>
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

      {/* 4. Banner Gambar (Tinggi responsif di portrait/landscape) */}
      <View style={[styles.bannerContainer, { height: bannerHeight }]}>
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
          width >= 900 && styles.ctaButtonWide,
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

  // ── Komponen UI: Loading ────────────────────────────────────────────────────
  const renderLoading = () => (
    <View
      style={styles.feedbackContainer}
      accessibilityRole="progressbar"
      accessibilityLabel="Memuat daftar barang, harap tunggu"
    >
      <ActivityIndicator size="large" color="#0F766E" />
      <Text style={styles.feedbackText} importantForAccessibility="no">
        Memuat barang terbaru…
      </Text>
    </View>
  );

  // ── Komponen UI: Error ─────────────────────────────────────────────────────
  const renderError = () => (
    <View
      style={styles.feedbackContainer}
      accessibilityRole="alert"
      accessibilityLabel={`Gagal memuat data. ${error}. Ketuk tombol Coba lagi untuk mengulang.`}
    >
      <Ionicons
        name="cloud-offline-outline"
        size={48}
        color="#DC2626"
        importantForAccessibility="no"
      />
      <Text style={styles.errorTitle} importantForAccessibility="no">
        Gagal Memuat Data
      </Text>
      <Text style={styles.errorMessage} importantForAccessibility="no">
        {error}
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.retryButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={fetchProducts}
        accessibilityRole="button"
        accessibilityLabel="Coba lagi memuat daftar barang"
        accessibilityHint="Mengulangi permintaan ke server untuk mengambil daftar barang terbaru"
      >
        <Ionicons
          name="refresh"
          size={18}
          color="#FFFFFF"
          importantForAccessibility="no"
        />
        <Text style={styles.retryButtonText} importantForAccessibility="no">
          Coba Lagi
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Screen Wrapper */}
      <View style={styles.screenContainer}>
        {/* Tampilkan loading atau error di atas FlatList agar header tetap muncul */}
        {isLoading ? (
          // Saat loading: tampilkan header + spinner di bawahnya
          <FlatList
            key="loading"
            data={[]}
            keyExtractor={() => 'empty'}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderLoading}
            contentContainerStyle={styles.listContentContainer}
            showsVerticalScrollIndicator={false}
            renderItem={() => null}
          />
        ) : error ? (
          // Saat error: tampilkan header + pesan error + tombol retry
          <FlatList
            key="error"
            data={[]}
<<<<<<< Updated upstream
=======
            keyExtractor={() => 'error'}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={
              <StateView
                status="error"
                errorKind={errorKind}
                message={errorMessage}
                onRetry={fetchProducts}
              />
            }
            contentContainerStyle={styles.listContentContainer}
            showsVerticalScrollIndicator={false}
            renderItem={() => null}
          />
        ) : status === 'empty' ? (
          // Saat request berhasil tetapi data barang kosong
          <FlatList
            key="empty"
            data={[]}
>>>>>>> Stashed changes
            keyExtractor={() => 'empty'}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderError}
            contentContainerStyle={styles.listContentContainer}
            showsVerticalScrollIndicator={false}
            renderItem={() => null}
          />
        ) : (
          // Saat data siap: tampilkan grid produk
          <FlatList
            key={`products-grid-${numColumns}`}
            data={paddedProducts}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            columnWrapperStyle={[
              styles.productRow,
              { paddingHorizontal: horizontalPadding },
            ]}
            ListHeaderComponent={renderListHeader}
            contentContainerStyle={styles.listContentContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              if (item.id.startsWith('__dummy_')) {
                return <View style={styles.dummyCard} />;
              }
              return <ProductCard product={item} onPress={handleProductPress} />;
            }}
            ListEmptyComponent={
              <View
                style={styles.emptyContainer}
                accessibilityRole="text"
                accessibilityLabel="Belum Ada Barang. Tidak ada barang bekas tersedia saat ini."
              >
                <Ionicons
                  name="file-tray-outline"
                  size={48}
                  color="#94A3B8"
                  importantForAccessibility="no"
                />
                <Text style={styles.emptyTitle} importantForAccessibility="no">
                  Belum Ada Barang
                </Text>
                <Text style={styles.emptySubtitle} importantForAccessibility="no">
                  Belum ada barang bekas yang tersedia saat ini. Jadilah yang pertama berjualan!
                </Text>
              </View>
            }
          />
        )}

        {/* 8. Bottom Navigation: Beranda, Kategori, Jual, Chat, Profil */}
        <BottomNav
          activeTab={currentTab}
          onTabPress={(tab) => {
            setCurrentTab(tab);
            if (tab === 'profil') {
              // Navigasi ke halaman Profil
              router.push('/(tabs)/profile' as any);
            } else if (tab === 'jual') {
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  ctaButtonWide: {
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
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
    gap: 12,
    marginBottom: 14,
  },
  dummyCard: {
    flex: 1,
    backgroundColor: 'transparent',
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

  // ── Feedback: Loading & Error ─────────────────────────────────────────────
  feedbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  feedbackText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 12,
  },
  errorMessage: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    minHeight: 44,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
