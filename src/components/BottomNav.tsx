import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type TabKey = 'beranda' | 'kategori' | 'jual' | 'chat' | 'profil';

interface BottomNavProps {
  activeTab?: TabKey;
  onTabPress?: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab = 'beranda',
  onTabPress,
}) => {
  return (
    <View
      style={styles.navBar}
      accessibilityRole="tablist"
      accessibilityLabel="Navigasi Bawah KampusMarket"
    >
      {/* 1. Beranda */}
      <Pressable
        style={styles.tabItem}
        onPress={() => onTabPress?.('beranda')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'beranda' }}
        accessibilityLabel="Tab Beranda"
        accessibilityHint="Navigasi ke halaman beranda utama"
      >
        <Ionicons
          name={activeTab === 'beranda' ? 'home' : 'home-outline'}
          size={22}
          color={activeTab === 'beranda' ? '#0F766E' : '#64748B'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'beranda' && styles.tabLabelActive,
          ]}
        >
          Beranda
        </Text>
      </Pressable>

      {/* 2. Kategori */}
      <Pressable
        style={styles.tabItem}
        onPress={() => onTabPress?.('kategori')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'kategori' }}
        accessibilityLabel="Tab Kategori"
        accessibilityHint="Buka daftar kategori per fakultas"
      >
        <Ionicons
          name={activeTab === 'kategori' ? 'grid' : 'grid-outline'}
          size={22}
          color={activeTab === 'kategori' ? '#0F766E' : '#64748B'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'kategori' && styles.tabLabelActive,
          ]}
        >
          Kategori
        </Text>
      </Pressable>

      {/* 3. Jual (Center Prominent Button) */}
      <Pressable
        style={styles.tabItemSell}
        onPress={() => onTabPress?.('jual')}
        accessibilityRole="button"
        accessibilityLabel="Tombol Jual Barang"
        accessibilityHint="Buka formulir pasang iklan barang bekas Anda"
      >
        <View style={styles.sellButtonBadge}>
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </View>
        <Text style={styles.sellLabel}>Jual</Text>
      </Pressable>

      {/* 4. Chat */}
      <Pressable
        style={styles.tabItem}
        onPress={() => onTabPress?.('chat')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'chat' }}
        accessibilityLabel="Tab Chat"
        accessibilityHint="Buka pesan dan obrolan dengan mahasiswa lain"
      >
        <View style={styles.iconWithBadge}>
          <Ionicons
            name={activeTab === 'chat' ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
            size={22}
            color={activeTab === 'chat' ? '#0F766E' : '#64748B'}
          />
          <View style={styles.unreadDot} />
        </View>
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'chat' && styles.tabLabelActive,
          ]}
        >
          Chat
        </Text>
      </Pressable>

      {/* 5. Profil */}
      <Pressable
        style={styles.tabItem}
        onPress={() => onTabPress?.('profil')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'profil' }}
        accessibilityLabel="Tab Profil"
        accessibilityHint="Buka profil mahasiswa dan status verifikasi NIM"
      >
        <Ionicons
          name={activeTab === 'profil' ? 'person' : 'person-outline'}
          size={22}
          color={activeTab === 'profil' ? '#0F766E' : '#64748B'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'profil' && styles.tabLabelActive,
          ]}
        >
          Profil
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 8,
    minHeight: 60,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 44, // Minimum tap target
    paddingVertical: 4,
  },
  tabItemSell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 44,
  },
  sellButtonBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F766E', // Kontras tinggi, teal modern
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  sellLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    marginTop: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#0F766E',
    fontWeight: '700',
  },
  iconWithBadge: {
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});

export default BottomNav;
