import { ListPengadaan, FormPemeliharan } from "@/types/rkbmd";

// ============================================================================
// ATURAN DEDUP
// ----------------------------------------------------------------------------
// Sebuah item HANYA dianggap "duplikat" (dan boleh dibuang salah satunya)
// jika SEMUA field di bawah ini sama persis. Jika ada satu field saja yang
// berbeda (misal `keterangan`, `jumlah`, atau `satuan` berbeda), maka item
// tersebut dianggap ITEM BERBEDA dan harus tetap disimpan keduanya — tidak
// boleh saling menimpa (overwrite).
//
// File ini menjadi satu-satunya sumber logika "apakah 2 item sama" sehingga
// dipakai konsisten di:
//   1. importExcel.ts  -> dedup baris yang terbaca dobel dari 1 file Excel
//   2. page.tsx         -> merge hasil import dengan data existing di storage
// ============================================================================

export function isEqualPengadaan(a: ListPengadaan, b: ListPengadaan): boolean {
    return (
        a.penggunaBarang === b.penggunaBarang &&
        a.kuasaPenggunaBarang === b.kuasaPenggunaBarang &&
        a.program === b.program &&
        a.kegiatan === b.kegiatan &&
        a.output === b.output &&
        a.usulan?.kodeBarang === b.usulan?.kodeBarang &&
        a.usulan?.namaBarang === b.usulan?.namaBarang &&
        a.usulan?.jumlah === b.usulan?.jumlah &&
        a.usulan?.satuan === b.usulan?.satuan &&
        a.bmdBisaDioptimalkan?.kodeBarang === b.bmdBisaDioptimalkan?.kodeBarang &&
        a.bmdBisaDioptimalkan?.namaBarang === b.bmdBisaDioptimalkan?.namaBarang &&
        a.bmdBisaDioptimalkan?.jumlah === b.bmdBisaDioptimalkan?.jumlah &&
        a.bmdBisaDioptimalkan?.satuan === b.bmdBisaDioptimalkan?.satuan &&
        a.kebutuhanRiil?.jumlah === b.kebutuhanRiil?.jumlah &&
        a.kebutuhanRiil?.satuan === b.kebutuhanRiil?.satuan
    );
}

export function isEqualPemeliharaan(a: FormPemeliharan, b: FormPemeliharan): boolean {
    return (
        a.penggunaBarang === b.penggunaBarang &&
        a.kuasaPenggunaBarang === b.kuasaPenggunaBarang &&
        a.program === b.program &&
        a.kegiatan === b.kegiatan &&
        a.output === b.output &&
        a.bmd?.kodeBarang === b.bmd?.kodeBarang &&
        a.bmd?.namaBarang === b.bmd?.namaBarang &&
        a.bmd?.jumlah === b.bmd?.jumlah &&
        a.bmd?.satuan === b.bmd?.satuan &&
        a.usulanPemeliharaan?.namaPemeliharaan === b.usulanPemeliharaan?.namaPemeliharaan &&
        a.usulanPemeliharaan?.jumlah === b.usulanPemeliharaan?.jumlah &&
        a.usulanPemeliharaan?.satuan === b.usulanPemeliharaan?.satuan &&
        a.keterangan === b.keterangan
    );
}

type EqualityFn<T> = (a: T, b: T) => boolean;

/**
 * Menghapus duplikat PERSIS (semua field sama) di dalam satu array.
 * Dipakai saat parsing 1 file Excel: mencegah baris yang terbaca dobel
 * (misal akibat bug parsing) ikut masuk 2x.
 *
 * Item pertama yang ditemukan dipertahankan, duplikat berikutnya dibuang.
 * Kompleksitas O(n^2) — cukup untuk ukuran data RKBMD per dinas (puluhan-ratusan baris).
 */
export function dedupArray<T>(items: T[], isEqual: EqualityFn<T>): T[] {
    const result: T[] = [];
    for (const item of items) {
        const isDuplicate = result.some((existing) => isEqual(existing, item));
        if (!isDuplicate) {
            result.push(item);
        }
    }
    return result;
}

/**
 * Menggabungkan data existing (dari storage) dengan data baru (hasil import
 * Excel) TANPA menghilangkan item yang sebenarnya berbeda.
 *
 * - Item baru yang PERSIS sama (semua field) dengan salah satu item existing
 *   akan dianggap duplikat -> tidak digandakan, cukup 1 kali saja.
 * - Item baru yang berbeda di field apapun (meski mirip, misal kode barang
 *   & nama pemeliharaan sama tapi keterangan berbeda) akan TETAP ditambahkan
 *   sebagai entri baru, BUKAN menimpa entri existing.
 * - Tidak ada mekanisme "update/overwrite" berbasis partial key di sini.
 *
 * Urutan hasil: semua item existing dulu, lalu item baru yang lolos dedup.
 */
export function mergeWithDedup<T>(
    existing: T[],
    incoming: T[],
    isEqual: EqualityFn<T>
): T[] {
    // 1. Pastikan existing sendiri juga tidak ada duplikat persis (jaring pengaman)
    const cleanExisting = dedupArray(existing, isEqual);

    // 2. Saring incoming: buang yang PERSIS sama dengan salah satu existing
    const newOnly = incoming.filter(
        (item) => !cleanExisting.some((existingItem) => isEqual(existingItem, item))
    );

    // 3. Saring juga duplikat PERSIS di antara sesama incoming (mis. baris dobel
    //    di Excel yang lolos dari dedup internal importExcel.ts)
    const newOnlyDeduped = dedupArray(newOnly, isEqual);

    return [...cleanExisting, ...newOnlyDeduped];
}

// ─── Wrapper siap pakai khusus Pengadaan & Pemeliharaan ───────────────────

export function dedupPengadaan(items: ListPengadaan[]): ListPengadaan[] {
    return dedupArray(items, isEqualPengadaan);
}

export function dedupPemeliharaan(items: FormPemeliharan[]): FormPemeliharan[] {
    return dedupArray(items, isEqualPemeliharaan);
}

export function mergePengadaan(
    existing: ListPengadaan[],
    incoming: ListPengadaan[]
): ListPengadaan[] {
    return mergeWithDedup(existing, incoming, isEqualPengadaan);
}

export function mergePemeliharaan(
    existing: FormPemeliharan[],
    incoming: FormPemeliharan[]
): FormPemeliharan[] {
    return mergeWithDedup(existing, incoming, isEqualPemeliharaan);
}