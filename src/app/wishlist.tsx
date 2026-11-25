/**
 * wishlist.tsx — Halaman Wishlist Marketplace KampusMarket
 *
 * Rute: /wishlist  (di luar grup (tabs) dan (auth))
 * Dibuka via router.push('/wishlist') dari halaman Profil.
 *
 * Fitur:
 *  1. Tampilkan data   — GET detail dengan JOIN products; AbortController; cleanup abort
 *  2. Loading          — StateView status="loading"
 *  3. Toggle is_bought — PATCH; teks judul dicoret saat aktif
 *  4. Hapus            — DELETE via ikon hati (klik lagi)
 *  5. Error handling   — try/catch; StateView error + Alert; kosong → StateView empty
 *  6. Refresh          — tombol reload di header + pull-to-refresh FlatList
 *
 * Tidak ada TextInput / form — interaksi hanya lewat tap.
 * Aksesibilitas: accessibilityLabel, accessibilityRole, tap target ≥ 44×44.
 * Tema: putih dan teal (#0F766E). Tidak ada pencetakan token ke console.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StateView } from '@/components/StateView';
import { ApiError } from '@/utils/apiError';
import {
  fetchWishlist,
  updateWishlistBought,
  removeFromWishlist,
} from '@/services/wishlistService';
import { WishlistItem } from '@/types/wishlist';

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Komponen kartu wishlist (di luar layar agar tidak remount saat state berubah) ──
interface WishlistCardProps {
  item: WishlistItem;
  isTogglingBought: boolean;
  isDeletingId: string | null;
  onToggleBought: (item: WishlistItem) => void;
  onDelete: (item: WishlistItem) => void;
}

function WishlistCard({
  item,
  isTogglingBought,
  isDeletingId,
  onToggleBought,
  onDelete,
}: WishlistCardProps) {
  const p = item.product;
  const isDeleting = isDeletingId === item.id;

  return (
    <View
      style={[styles.card, item.isBought && styles.cardBought]}
      accessibilityRole="none"
    >
      {/* Gambar produk */}
      {p?.imageUrl ? (
        <Image
          source={{ uri: p.imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Ionicons name="image-outline" size={28} color="#CBD5E1" importantForAccessibility="no" />
        </View>
      )}

      {/* Konten teks */}
      <View style={styles.cardContent}>
        {/* Judul — dicoret bila is_bought */}
        <Text
          style={[styles.cardTitle, item.isBought && styles.cardTitleBought]}
          numberOfLines={2}
          accessibilityRole="text"
          accessibilityLabel={p?.title ?? 'Barang tidak tersedia'}
        >
          {p?.title ?? 'Barang tidak tersedia'}
        </Text>

        {/* Harga */}
        {p?.price !== undefined && (
          <Text style={styles.cardPrice} importantForAccessibility="no">
            {formatRupiah(p.price)}
          </Text>
        )}

        {/* Penjual */}
        {p?.sellerName && (
          <Text style={styles.cardSeller} importantForAccessibility="no" numberOfLines={1}>
            {p.sellerName}
          </Text>
        )}

        {/* Badge sudah dibeli */}
        {item.isBought && (
          <View style={styles.boughtBadge}>
            <Text style={styles.boughtBadgeText} importantForAccessibility="no">
              Sudah dibeli ✓
            </Text>
          </View>
        )}

        {/* Tombol aksi baris bawah */}
        <View style={styles.cardActions}>
          {/* Toggle is_bought */}
          <Pressable
            style={({ pressed }) => [
              styles.toggleButton,
              item.isBought && styles.toggleButtonActive,
              pressed && styles.buttonPressed,
              isTogglingBought && styles.buttonDisabled,
            ]}
            onPress={() => onToggleBought(item)}
            disabled={isTogglingBought || isDeleting}
            accessibilityRole="checkbox"
            accessibilityLabel={
              item.isBought
                ? `Tandai "${p?.title ?? 'barang'}" belum dibeli`
                : `Tandai "${p?.title ?? 'barang'}" sudah dibeli`
            }
            accessibilityHint="Ketuk untuk mengubah status pembelian"
            accessibilityState={{ checked: item.isBought, disabled: isTogglingBought }}
          >
            <Ionicons
              name={item.isBought ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={item.isBought ? '#FFFFFF' : '#0F766E'}
              importantForAccessibility="no"
            />
            <Text
              style={[
                styles.toggleButtonText,
                item.isBought && styles.toggleButtonTextActive,
              ]}
              importantForAccessibility="no"
            >
              {item.isBought ? 'Sudah dibeli' : 'Tandai dibeli'}
            </Text>
          </Pressable>

          {/* Hapus dari wishlist */}
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.buttonPressed,
              isDeleting && styles.buttonDisabled,
            ]}
            onPress={() => onDelete(item)}
            disabled={isDeleting || isTogglingBought}
            accessibilityRole="button"
            accessibilityLabel={`Hapus "${p?.title ?? 'barang'}" dari wishlist`}
            accessibilityHint="Ketuk untuk menghapus barang dari wishlist"
            accessibilityState={{ busy: isDeleting, disabled: isDeleting }}
          >
            <Ionicons
              name={isDeleting ? 'hourglass-outline' : 'heart'}
              size={18}
              color="#E11D48"
              importantForAccessibility="no"
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Halaman utama ────────────────────────────────────────────────────────────
export default function WishlistScreen() {
  const router = useRouter();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ID item yang sedang di-toggle bought atau dihapus
  const [togglingBoughtId, setTogglingBoughtId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // ── Load data ───────────────────────────────────────────────────────────────
  const loadItems = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null);
      const data = await fetchWishlist(signal);
      setItems(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Gagal memuat wishlist. Silakan coba lagi.';
      setError(msg);
      if (!(err instanceof ApiError && err.kind === 'unauthorized')) {
        Alert.alert('Gagal Memuat', msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    loadItems(controller.signal);
    return () => {
      controller.abort();
    };
  }, []); // dependency [] — hanya saat mount

  // ── Pull-to-refresh ─────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchWishlist();
      setItems(data);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg =
        err instanceof ApiError ? err.message : 'Gagal memuat wishlist.';
      Alert.alert('Gagal Refresh', msg);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ── Reload dari header ──────────────────────────────────────────────────────
  const handleReload = useCallback(async () => {
    abortRef.current?.abort();
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    await loadItems(controller.signal);
  }, [loadItems]);

  // ── Toggle is_bought ────────────────────────────────────────────────────────
  const handleToggleBought = useCallback(async (item: WishlistItem) => {
    if (togglingBoughtId || deletingId) return;
    setTogglingBoughtId(item.id);
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isBought: !i.isBought } : i))
    );
    try {
      const updated = await updateWishlistBought(item.id, !item.isBought);
      // Pertahankan data product bila PATCH hanya mengembalikan kolom tabel wishlist
      setItems((prev) =>
        prev.map((i) =>
          i.id === updated.id
            ? { ...updated, product: updated.product ?? i.product }
            : i
        )
      );
    } catch (err) {
      // Rollback
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isBought: item.isBought } : i))
      );
      if (!(err instanceof ApiError && err.kind === 'unauthorized')) {
        const msg =
          err instanceof ApiError ? err.message : 'Gagal mengubah status.';
        Alert.alert('Gagal Ubah Status', msg);
      }
    } finally {
      setTogglingBoughtId(null);
    }
  }, [togglingBoughtId, deletingId]);

  // ── Hapus dari wishlist ─────────────────────────────────────────────────────
  const handleDelete = useCallback(async (item: WishlistItem) => {
    if (togglingBoughtId || deletingId) return;
    setDeletingId(item.id);
    try {
      await removeFromWishlist(item.productId);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      if (!(err instanceof ApiError && err.kind === 'unauthorized')) {
        const msg =
          err instanceof ApiError ? err.message : 'Gagal menghapus dari wishlist.';
        Alert.alert('Gagal Hapus', msg);
      }
    } finally {
      setDeletingId(null);
    }
  }, [togglingBoughtId, deletingId]);

  // ── Render item ─────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: WishlistItem }) => (
      <WishlistCard
        item={item}
        isTogglingBought={togglingBoughtId === item.id}
        isDeletingId={deletingId}
        onToggleBought={handleToggleBought}
        onDelete={handleDelete}
      />
    ),
    [togglingBoughtId, deletingId, handleToggleBought, handleDelete]
  );

  const renderEmpty = useCallback(() => {
    if (loading || error) return null;
    return (
      <StateView
        status="empty"
        title="Wishlist masih kosong"
        message="Wishlist masih kosong, tekan hati pada barang untuk menyimpan"
      />
    );
  }, [loading, error]);

  // ── Layout ──────────────────────────────────────────────────────────────────
  const showLoading = loading && !refreshing;
  const showError = !loading && !!error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Kembali ke halaman sebelumnya"
          accessibilityHint="Ketuk untuk kembali"
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" importantForAccessibility="no" />
        </Pressable>

        <Text style={styles.headerTitle} accessibilityRole="header">
          Wishlist Saya
        </Text>

        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
          onPress={handleReload}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Muat ulang daftar wishlist"
          accessibilityHint="Ketuk untuk mengambil ulang data dari server"
          accessibilityState={{ busy: loading }}
        >
          <Ionicons name="refresh" size={22} color="#0F766E" importantForAccessibility="no" />
        </Pressable>
      </View>

      {/* Body */}
      {showLoading ? (
        <ScrollView contentContainerStyle={styles.centerContainer}>
          <StateView status="loading" />
        </ScrollView>
      ) : showError ? (
        <ScrollView contentContainerStyle={styles.centerContainer}>
          <StateView
            status="error"
            message={error ?? undefined}
            onRetry={handleReload}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  headerBtnPressed: { backgroundColor: '#F1F5F9' },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  centerContainer: { flexGrow: 1, justifyContent: 'center' },

  // Kartu wishlist
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardBought: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  cardImage: {
    width: 90,
    height: 90,
    backgroundColor: '#F1F5F9',
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 19,
    marginBottom: 2,
  },
  cardTitleBought: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D9488',
    marginBottom: 2,
  },
  cardSeller: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  boughtBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  boughtBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },

  // Tombol aksi
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#0F766E',
    backgroundColor: '#FFFFFF',
  },
  toggleButtonActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  toggleButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F766E',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  deleteButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#FFF1F2',
  },
  buttonPressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  buttonDisabled: { opacity: 0.5 },
});
