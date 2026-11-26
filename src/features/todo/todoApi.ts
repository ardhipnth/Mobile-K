/**
 * todoApi.ts — Lapisan pengambilan data Todo
 *
 * Hanya menggunakan fetch() biasa ke JSONPlaceholder.
 * TIDAK mengimpor AuthContext, apiClient, atau service KampusMarket lainnya.
 * TIDAK mengirimkan token autentikasi apapun.
 *
 * Catatan: JSONPlaceholder adalah API simulasi — POST dan PATCH tidak
 * benar-benar menyimpan data di server.
 *
 * ─── Alur Request ──────────────────────────────────────────────────────────
 *
 *  fetchTodos():
 *    1. Buat AbortController, kirim ke pemanggil agar bisa dibatalkan.
 *    2. fetch GET /todos?_limit=10 dengan signal abort.
 *    3. Periksa response.ok → lempar Error jika gagal.
 *    4. Parse JSON → kembalikan TodoItem[].
 *
 *  addTodo():
 *    1. fetch POST /todos dengan body JSON {title, completed, userId}.
 *    2. Periksa response.ok → lempar Error jika gagal.
 *    3. Parse JSON → kembalikan TodoItem dari server.
 *
 *  toggleTodo():
 *    1. fetch PATCH /todos/{id} dengan body JSON {completed}.
 *    2. Periksa response.ok → lempar Error jika gagal.
 *    3. Parse JSON → kembalikan TodoItem yang diperbarui.
 */

const BASE_URL = 'https://jsonplaceholder.typicode.com';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
  /** Jika true, item ini ditambahkan secara lokal dan id-nya lokal (negatif). */
  isLocal?: boolean;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/** Periksa response.ok; lempar Error dengan pesan yang dapat dibaca jika gagal. */
async function assertOk(res: Response): Promise<void> {
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.text();
      detail = body ? ` — ${body.slice(0, 120)}` : '';
    } catch {
      // abaikan error membaca body
    }
    throw new Error(`HTTP ${res.status} ${res.statusText}${detail}`);
  }
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Ambil 10 todo pertama dari server.
 *
 * @param signal - AbortSignal dari AbortController di useEffect.
 */
export async function fetchTodos(signal: AbortSignal): Promise<TodoItem[]> {
  const res = await fetch(`${BASE_URL}/todos?_limit=10`, {
    method: 'GET',
    headers: buildHeaders(),
    signal,
  });
  await assertOk(res);
  return (await res.json()) as TodoItem[];
}

/**
 * Kirim todo baru ke server (simulasi).
 * JSONPlaceholder selalu mengembalikan id=201, sehingga id lokal unik
 * harus diberikan oleh pemanggil.
 *
 * @param title - Judul todo (sudah divalidasi tidak kosong oleh pemanggil).
 */
export async function addTodo(title: string): Promise<TodoItem> {
  const res = await fetch(`${BASE_URL}/todos`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ title, completed: false, userId: 1 }),
  });
  await assertOk(res);
  return (await res.json()) as TodoItem;
}

/**
 * Toggle status selesai todo di server (simulasi).
 * Hanya dipanggil untuk todo yang berasal dari server (id positif ≤ 200).
 *
 * @param id        - Id todo di server.
 * @param completed - Status baru.
 */
export async function toggleTodo(id: number, completed: boolean): Promise<TodoItem> {
  const res = await fetch(`${BASE_URL}/todos/${id}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify({ completed }),
  });
  await assertOk(res);
  return (await res.json()) as TodoItem;
}

