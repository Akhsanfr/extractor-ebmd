# Perubahan schema yang diperlukan (belum diterapkan: repository tidak tersedia di sesi ini)

Ada dua perubahan pada `rekonTable`: kolom `tahun` baru dan unique constraint.
`upsertRealisasi` dan `insertIgnore` memakai `ON CONFLICT (tahun, bulan, rekon_type, perangkat_daerah_id)`,
jadi tanpa constraint ini import dan inisiasi akan error.

```ts
import { unique } from "drizzle-orm/pg-core"; // tambahkan ke import yang sudah ada

// di dalam kolom rekonTable:
tahun: integer().notNull(),

// di callback indeks:
(table) => [
    index().on(table.tahun, table.bulan),
    index().on(table.perangkatDaerahId),
    unique("rekon_tahun_bulan_rekon_type_perangkat_daerah_unique").on(
        table.tahun,
        table.bulan,
        table.rekonType,
        table.perangkatDaerahId,
    ),
    check("rekon_bulan_check", sql`${table.bulan} BETWEEN 1 AND 12`),
],
```

Index `index().on(table.bulan)` yang lama boleh diganti dengan index `(tahun, bulan)` di atas,
karena semua query list sekarang memfilter keduanya.

## Migrasi

Kolom `tahun` NOT NULL tanpa default akan gagal ditambahkan jika tabel sudah berisi baris.
Jika sudah ada data, edit SQL hasil `drizzle-kit generate` menjadi tiga langkah:

1. `ALTER TABLE rekon ADD COLUMN tahun integer;`
2. `UPDATE rekon SET tahun = <tahun data lama>;`
3. `ALTER TABLE rekon ALTER COLUMN tahun SET NOT NULL;` lalu tambahkan unique constraint.

Jika tabel masih kosong, hasil generate bisa dipakai apa adanya. Jika ada baris ganda untuk
kombinasi yang sama, pembuatan unique constraint akan gagal; bersihkan dulu duplikatnya.
