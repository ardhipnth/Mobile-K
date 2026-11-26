/**
 * src/app/todo.tsx — Rute /todo
 *
 * Rute ini berada di luar grup (tabs) dan (auth), sehingga dapat dibuka
 * tanpa harus login. AuthGuard di _layout.tsx telah diberi pengecualian
 * untuk segment "todo".
 *
 * File ini hanya meneruskan (re-export) tampilan dari src/features/todo/
 * sesuai prinsip pemisahan concerns: routing di /app, logika di /features.
 */

export { default } from '@/features/todo/TodoScreen';

