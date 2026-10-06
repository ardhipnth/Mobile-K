import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
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
  style?: StyleProp<ViewStyle>;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, style }) => {
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        style,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress?.(product)}
      accessibilityRole="button"
      accessibilityLabel={`Barang: ${product.title}, harga ${formattedPrice}, kondisi ${product.condition}, lokasi di ${product.location}, penjual ${product.sellerName}`}
      accessibilityHint="Ketuk untuk melihat rincian barang dan menghubungi mahasiswa penjual"
    >
      {/* Gambar Produk */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.productImage}
          resizeMode="cover"
          accessibilityLabel={`Foto produk ${product.title}`}
        />
        {/* Badge Kondisi */}
        <View style={styles.conditionBadge}>
          <Text style={styles.conditionText}>{product.condition}</Text>
        </View>
      </View>

      {/* Informasi Produk */}
      <View style={styles.contentContainer}>
        {/* Fakultas Badge */}
        <View style={styles.facultyBadge}>
          <Text style={styles.facultyBadgeText} numberOfLines={1}>
            {product.faculty}
          </Text>
        </View>

        {/* Judul Barang */}
        <Text style={styles.titleText} numberOfLines={2}>
          {product.title}
        </Text>

        {/* Harga */}
        <Text style={styles.priceText}>{formattedPrice}</Text>

        {/* Lokasi COD di Kampus */}
        <View style={styles.metaRow}>
          <Ionicons name="location-sharp" size={13} color="#64748B" />
          <Text style={styles.locationText} numberOfLines={1}>
            {product.location}
          </Text>
        </View>

        {/* Penjual & Verifikasi NIM */}
        <View style={styles.sellerRow}>
          <Text style={styles.sellerNameText} numberOfLines={1}>
            {product.sellerName}
          </Text>
          {product.isNIMVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#059669" />
              <Text style={styles.verifiedText}>NIM ✓</Text>
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
    aspectRatio: 4 / 3,
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
