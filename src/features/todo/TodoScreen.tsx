/**
 * TodoScreen.tsx — Halaman Todo List (fitur mandiri)
 *
 * ─── Desain Komponen ──────────────────────────────────────────────────────────
 *
 * Komponen ini sepenuhnya TERPISAH dari aplikasi KampusMarket:
 *   • Tidak mengimpor AuthContext, apiClient, atau service KampusMarket lain.
 *   • Semua request jaringan lewat todoApi.ts menggunakan fetch() biasa.
 *   • Tidak ada token yang dikirimkan.
 *
 * ─── Alur Lengkap ─────────────────────────────────────────────────────────────
 *
 *  LOAD DATA (useEffect, deps: [fetchKey]):
 *    1. Set loading=true, error=null.
 *    2. Buat AbortController, kirim signal ke fetchTodos().
 *    3. await fetchTodos(signal) → GET /todos?_limit=10.
 *    4. Jika berhasil: set data=hasil, loading=false.
 *    5. Jika error (dan bukan abort): set error=pesan, loading=false, tampilkan Alert.
 *    6. Cleanup: abort controller saat unmount atau fetchKey berubah.
 *
 *  TAMBAH TODO:
 *    1. Validasi judul tidak kosong (tampilkan pesan inline).
 *    2. Set addLoading=true.
 *    3. await addTodo(title) → POST /todos {title, completed:false, userId:1}.
 *    4. Assign id lokal unik (negatif, dari localIdCounter yang terus turun).
 *    5. Tambahkan ke awal daftar state lokal (prepend).
 *    6. Reset input.
 *    7. Jika error: tampilkan Alert, set addError.
 *
 *  TOGGLE STATUS:
 *    - Jika todo.isLocal (id negatif): ubah state lokal saja tanpa PATCH ke server.
 *    - Jika todo dari server: await toggleTodo(id, !completed) → PATCH /todos/{id}.
 *      Perbarui state berdasarkan respons server.
 *    - Jika error PATCH: tampilkan Alert, kembalikan state ke semula (rollback).
 *
 *  REFRESH:
 *    1. Naikkan fetchKey → memicu useEffect → ambil ulang dari server.
 *    2. Daftar kembali ke data server (todo lokal hilang).
 *
 *  ERROR HANDLING:
 *    - try/catch di semua request.
 *    - Periksa response.ok di todoApi (lempar Error jika gagal).
 *    - Tampilkan Alert + teks error di layar dengan tombol "Coba Lagi".
 *    - Tidak mencetak data sensitif ke console.
 *
 * ─── Aksesibilitas ────────────────────────────────────────────────────────────
 *   • Setiap elemen interaktif: accessibilityLabel + accessibilityRole.
 *   • Tap target minimal 44×44 (minHeight/minWidth: 44 di semua tombol).
 *   • Teks "Coba Lagi" sebagai fallback teks error di layar.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { addTodo, fetchTodos, toggleTodo, type TodoItem } from './todoApi';

// ─── Counter id lokal ─────────────────────────────────────────────────────────
// Id lokal selalu negatif agar tidak bentrok dengan id server (1–200).
let localIdCounter = -1;
function nextLocalId(): number {
  return localIdCounter--;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TodoScreen() {
  const router = useRouter();

  // ── State Utama ─────────────────────────────────────────────────────────────
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── State Tambah Todo ───────────────────────────────────────────────────────
  const [inputTitle, setInputTitle] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ── State Toggle ────────────────────────────────────────────────────────────
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // ── Trigger Refresh ─────────────────────────────────────────────────────────
  // Menaikkan fetchKey akan memicu useEffect untuk mengambil ulang data.
  const [fetchKey, setFetchKey] = useState(0);

  // ─── Fetch Data (useEffect dengan AbortController) ──────────────────────────
  useEffect(() => {
    // Inisialisasi AbortController untuk request ini
    const controller = new AbortController();

    async function loadTodos() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchTodos(controller.signal);
        setTodos(data);
      } catch (err: unknown) {
        // Jangan tampilkan error jika request sengaja dibatalkan (cleanup)
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : 'Gagal memuat data. Periksa koneksi internet.';
        setError(message);
        Alert.alert('Gagal Memuat Todo', message, [{ text: 'OK' }]);
      } finally {
        // Hanya set loading=false jika bukan abort
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadTodos();

    // Cleanup: batalkan request jika komponen unmount atau fetchKey berubah
    return () => {
      controller.abort();
    };
  }, [fetchKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Tambah Todo ─────────────────────────────────────────────────────────────
  const handleAddTodo = useCallback(async () => {
    // Validasi: judul tidak boleh kosong
    const trimmed = inputTitle.trim();
    if (!trimmed) {
      setInputError('Judul todo tidak boleh kosong.');
      return;
    }
    setInputError(null);
    setAddError(null);
    setAddLoading(true);

    try {
      const serverTodo = await addTodo(trimmed);

      // JSONPlaceholder selalu mengembalikan id=201 untuk POST.
      // Beri id lokal unik agar key FlatList tidak bentrok saat ada
      // beberapa todo yang ditambahkan.
      const localTodo: TodoItem = {
        ...serverTodo,
        id: nextLocalId(),
        title: trimmed, // pastikan memakai judul yang dikirim user
        completed: false,
        isLocal: true,
      };

      setTodos((prev) => [localTodo, ...prev]);
      setInputTitle('');

      // Umumkan ke screen reader
      AccessibilityInfo.announceForAccessibility(
        `Todo "${trimmed}" berhasil ditambahkan.`,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal menambahkan todo.';
      setAddError(message);
      Alert.alert('Gagal Menambahkan Todo', message, [{ text: 'OK' }]);
    } finally {
      setAddLoading(false);
    }
  }, [inputTitle]);

  // ─── Toggle Status Todo ───────────────────────────────────────────────────────
  const handleToggle = useCallback(
    async (item: TodoItem) => {
      if (togglingId !== null) return; // cegah toggle ganda
      const newCompleted = !item.completed;

      // Untuk todo lokal (id negatif): ubah state saja, tanpa PATCH ke server
      if (item.isLocal) {
        setTodos((prev) =>
          prev.map((t) =>
            t.id === item.id ? { ...t, completed: newCompleted } : t,
          ),
        );
        return;
      }

      // Untuk todo dari server: optimistic update dulu, lalu konfirmasi dari server
      setTogglingId(item.id);
      setTodos((prev) =>
        prev.map((t) =>
          t.id === item.id ? { ...t, completed: newCompleted } : t,
        ),
      );

      try {
        const updated = await toggleTodo(item.id, newCompleted);
        // Perbarui state dengan respons aktual dari server
        setTodos((prev) =>
          prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
        );
      } catch (err: unknown) {
        // Rollback jika PATCH gagal
        setTodos((prev) =>
          prev.map((t) =>
            t.id === item.id ? { ...t, completed: item.completed } : t,
          ),
        );
        const message =
          err instanceof Error ? err.message : 'Gagal mengubah status todo.';
        Alert.alert('Gagal Mengubah Status', message, [{ text: 'OK' }]);
      } finally {
        setTogglingId(null);
      }
    },
    [togglingId],
  );

  // ─── Refresh ─────────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  // ─── Navigasi Kembali ─────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login' as never);
    }
  }, [router]);

  // ─── Render Item ──────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: TodoItem }) => {
      const isToggling = togglingId === item.id;
      return (
        <View
          style={styles.todoItem}
          accessibilityRole="none"
          accessible={false}
        >
          {/* Switch toggle */}
          <Switch
            value={item.completed}
            onValueChange={() => handleToggle(item)}
            disabled={isToggling}
            trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
            thumbColor={item.completed ? '#1D4ED8' : '#94A3B8'}
            accessibilityLabel={`${item.isLocal ? '[Lokal] ' : ''}${item.completed ? 'Selesai' : 'Belum selesai'}: ${item.title}`}
            accessibilityRole="switch"
            accessibilityHint="Ketuk untuk mengubah status selesai"
            accessibilityState={{ checked: item.completed, busy: isToggling }}
            style={styles.switch}
          />

          {/* Judul todo */}
          <View style={styles.todoContent}>
            <Text
              style={[
                styles.todoTitle,
                item.completed && styles.todoTitleDone,
              ]}
              accessibilityLabel={
                item.completed
                  ? `Selesai: ${item.title}`
                  : `Belum selesai: ${item.title}`
              }
            >
              {item.title}
            </Text>
            {item.isLocal && (
              <Text style={styles.localBadge} accessibilityLabel="Todo lokal">
                lokal
              </Text>
            )}
          </View>
        </View>
      );
    },
    [handleToggle, togglingId],
  );

  // ─── Key Extractor ────────────────────────────────────────────────────────────
  const keyExtractor = useCallback(
    (item: TodoItem) => String(item.id),
    [],
  );

  // ─── Render Utama ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header} accessibilityRole="header">
          {/* Tombol Kembali */}
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Kembali ke halaman sebelumnya"
            accessibilityRole="button"
            accessibilityHint="Ketuk untuk kembali ke halaman login"
          >
            <Text style={styles.backButtonText}>← Kembali</Text>
          </Pressable>

          {/* Judul Halaman */}
          <Text style={styles.headerTitle} accessibilityRole="header">
            Todo List
          </Text>

          {/* Tombol Reload */}
          <Pressable
            onPress={handleRefresh}
            style={({ pressed }) => [
              styles.reloadButton,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Muat ulang daftar todo dari server"
            accessibilityRole="button"
            accessibilityHint="Data lokal akan hilang dan daftar kembali ke data server"
            disabled={loading}
          >
            <Text style={styles.reloadButtonText}>
              {loading ? '...' : '↺ Reload'}
            </Text>
          </Pressable>
        </View>

        {/* ── Catatan API Simulasi ─────────────────────────────────────────── */}
        <View
          style={styles.apiBanner}
          accessibilityRole="text"
          accessibilityLabel="Catatan: API ini simulasi. Data yang ditambah atau diubah tidak tersimpan di server."
        >
          <Text style={styles.apiBannerText}>
            ℹ️ API simulasi (JSONPlaceholder) — data POST/PATCH tidak tersimpan
            permanen di server.
          </Text>
        </View>

        {/* ── Error Banner ─────────────────────────────────────────────────── */}
        {error && !loading && (
          <View
            style={styles.errorBanner}
            accessibilityRole="alert"
            accessibilityLabel={`Error: ${error}`}
          >
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
              accessibilityLabel="Coba lagi memuat todo"
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Coba Lagi</Text>
            </Pressable>
          </View>
        )}

        {/* ── Form Tambah Todo ─────────────────────────────────────────────── */}
        <View style={styles.addForm}>
          <TextInput
            style={[styles.input, inputError ? styles.inputError : null]}
            value={inputTitle}
            onChangeText={(t) => {
              setInputTitle(t);
              if (inputError) setInputError(null);
              if (addError) setAddError(null);
            }}
            placeholder="Judul todo baru..."
            placeholderTextColor="#94A3B8"
            returnKeyType="done"
            onSubmitEditing={handleAddTodo}
            editable={!addLoading}
            maxLength={200}
            accessibilityLabel="Judul todo baru"
            accessibilityHint="Ketik judul todo lalu ketuk Tambah atau tekan Enter"
          />

          <Pressable
            onPress={handleAddTodo}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
              addLoading && styles.buttonDisabled,
            ]}
            disabled={addLoading}
            accessibilityLabel="Tambah todo baru"
            accessibilityRole="button"
            accessibilityState={{ disabled: addLoading, busy: addLoading }}
          >
            {addLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.addButtonText}>Tambah</Text>
            )}
          </Pressable>
        </View>

        {/* Error input kosong */}
        {inputError && (
          <Text
            style={styles.inputErrorText}
            accessibilityRole="alert"
            accessibilityLabel={inputError}
          >
            {inputError}
          </Text>
        )}

        {/* Error tambah todo */}
        {addError && (
          <Text
            style={styles.inputErrorText}
            accessibilityRole="alert"
            accessibilityLabel={`Gagal menambahkan: ${addError}`}
          >
            ⚠️ {addError}
          </Text>
        )}

        {/* ── Daftar Todo ──────────────────────────────────────────────────── */}
        {loading ? (
          <View
            style={styles.loadingContainer}
            accessibilityLabel="Memuat daftar todo"
            accessibilityRole="progressbar"
          >
            <ActivityIndicator size="large" color="#1D4ED8" />
            <Text style={styles.loadingText}>Memuat todo...</Text>
          </View>
        ) : (
          <FlatList
            data={todos}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            style={styles.list}
            contentContainerStyle={
              todos.length === 0 ? styles.emptyContent : styles.listContent
            }
            ListEmptyComponent={
              <Text
                style={styles.emptyText}
                accessibilityRole="text"
                accessibilityLabel="Tidak ada todo. Tambahkan todo pertama kamu."
              >
                Belum ada todo. Tambahkan sekarang!
              </Text>
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            accessibilityLabel="Daftar todo"
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EFF6FF', // biru sangat terang
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1D4ED8', // biru primer
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 56,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },

  // Tombol Kembali
  backButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: '#BFDBFE',
    fontSize: 15,
    fontWeight: '600',
  },

  // Tombol Reload
  reloadButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  reloadButtonText: {
    color: '#BFDBFE',
    fontSize: 15,
    fontWeight: '600',
  },

  // Press feedback
  pressed: {
    opacity: 0.7,
  },

  // Banner API simulasi
  apiBanner: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  apiBannerText: {
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
  },

  // Error Banner
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'column',
    gap: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minHeight: 44,
    minWidth: 120,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Form Tambah Todo
  addForm: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  addButton: {
    minWidth: 80,
    minHeight: 44,
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Pesan error input
  inputErrorText: {
    color: '#DC2626',
    fontSize: 12,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 2,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#1D4ED8',
    fontSize: 15,
    fontWeight: '500',
  },

  // Daftar
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Item Todo
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  switch: {
    // Switch sudah cukup besar secara default, tapi pastikan tap area oke
    transform: [{ scale: 1.0 }],
  },
  todoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  todoTitle: {
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 20,
    flex: 1,
  },
  todoTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  localBadge: {
    fontSize: 10,
    color: '#1D4ED8',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
    overflow: 'hidden',
  },
});

