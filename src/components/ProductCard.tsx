import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ProductItem {
  id: string;
  title: string;
  price: number;
  faculty: string;
  condition: string;
  location: string;
  imageUrl: string;
  sellerName: string;
  isNIMVerified?: boolean;
}

interface ProductCardProps {
  product: ProductItem;
  onPress?: (product: ProductItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(product.price);

  // Tambahkan info NIM ke label aksesibilitas jika terverifikasi
  const nimSuffix = product.isNIMVerified ? ', penjual terverifikasi NIM' : ', penjual belum terverifikasi';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress?.(product)}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, harga ${formattedPrice}, kondisi ${product.condition}, lokasi ${product.location}, penjual ${product.sellerName}${nimSuffix}`}
      accessibilityHint="Ketuk untuk melihat detail barang dan menghubungi penjual"
    >
      {/* Gambar Produk — dekoratif, diabaikan screen reader */}
      <View style={styles.imageWrapper} importantForAccessibility="no">
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.productImage}
          resizeMode="cover"
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
        {/* Badge Kondisi */}
        <View style={styles.conditionBadge} importantForAccessibility="no">
          <Text style={styles.conditionText} importantForAccessibility="no">{product.condition}</Text>
        </View>
      </View>

      {/* Informasi Produk — semua teks diabaikan karena label sudah lengkap di Pressable */}
      <View style={styles.contentContainer} importantForAccessibility="no">
        {/* Fakultas Badge */}
        <View style={styles.facultyBadge} importantForAccessibility="no">
          <Text style={styles.facultyBadgeText} numberOfLines={1} importantForAccessibility="no">
            {product.faculty}
          </Text>
        </View>

        {/* Judul Barang */}
        <Text style={styles.titleText} numberOfLines={2} importantForAccessibility="no">
          {product.title}
        </Text>

        {/* Harga */}
        <Text style={styles.priceText} importantForAccessibility="no">{formattedPrice}</Text>

        {/* Lokasi COD di Kampus */}
        <View style={styles.metaRow} importantForAccessibility="no">
          <Ionicons name="location-sharp" size={13} color="#64748B" importantForAccessibility="no" />
          <Text style={styles.locationText} numberOfLines={1} importantForAccessibility="no">
            {product.location}
          </Text>
        </View>

        {/* Penjual & Verifikasi NIM */}
        <View style={styles.sellerRow} importantForAccessibility="no">
          <Text style={styles.sellerNameText} numberOfLines={1} importantForAccessibility="no">
            {product.sellerName}
          </Text>
          {product.isNIMVerified && (
            <View style={styles.verifiedBadge} importantForAccessibility="no">
              <Ionicons name="shield-checkmark" size={12} color="#059669" importantForAccessibility="no" />
              <Text style={styles.verifiedText} importantForAccessibility="no">NIM ✓</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    minHeight: 270,
    minWidth: 44, // Memenuhi kriteria minimum ukuran tap aksesibilitas
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  imageWrapper: {
    width: '100%',
    height: 135,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  facultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 5,
  },
  facultyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A', // Kontras tinggi WCAG AAA
    lineHeight: 18,
    marginBottom: 4,
    minHeight: 36,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D9488', // Warna teal kontras dan modern
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  sellerNameText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#334155',
    flex: 1,
    marginRight: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
});

export default ProductCard;
