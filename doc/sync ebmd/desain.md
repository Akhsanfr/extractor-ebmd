# Desain Sinkronisasi BMD dari eBMD

## Tujuan

Menyalin data BMD dari eBMD ke database lokal menggunakan mekanisme sinkronisasi berdasarkan perangkat daerah dan jenis BMD, dengan kontrol proses (play/pause/resume/stop) dan progres real-time di UI.

## Tabel

### bmd

Menyimpan data master hasil sinkronisasi dari eBMD. Key utama adalah `nibar` (primary key), sehingga proses upsert bersifat idempotent — aman diulang tanpa menimbulkan duplikasi.

### bmd_sync

Menyimpan informasi induk satu **sync list** yang dibuat user (mencakup satu atau banyak perangkat daerah, masing-masing dengan satu atau lebih jenis aset).

Mencatat:

* status keseluruhan
* total, berhasil, gagal (dihitung per baris `bmd_sub_sync`, yaitu per kombinasi perangkat daerah + jenis aset)
* waktu mulai
* waktu selesai

### bmd_sub_sync

Merepresentasikan satu **sub-sync**: kombinasi (perangkat daerah, jenis aset) di dalam satu `bmd_sync`. Ini adalah unit terkecil yang punya progress, checkpoint, dan kontrol individual (step UI #3–#5).

Mencatat:

* referensi ke `bmd_sync` dan perangkat daerah
* jenis aset (`asset_type`) — dipindahkan dari `bmd_sync`
* status proses
* jumlah data (total/berhasil/gagal) — sumber untuk tampilan progres "500/10000"
* jumlah percobaan retry yang sudah dilakukan
* baris terakhir yang berhasil diproses (checkpoint, untuk resume)
* pesan error terakhir
* flag/permintaan stop (lihat bagian Kontrol Proses)
* waktu mulai dan waktu selesai

## Relasi

```text
bmd_sync
    └── bmd_sub_sync (banyak baris: 1 per kombinasi perangkat daerah + jenis aset)

```

## Step UI

1. **Buat sync list**: user memilih perangkat daerah dan satu atau lebih jenis aset per perangkat daerah. Sistem membuat satu `bmd_sync`, lalu satu baris `bmd_sub_sync` untuk **setiap kombinasi** perangkat daerah × jenis aset yang dipilih.
2. **Tabel daftar sync list** (level `bmd_sync`): menampilkan status ringkasan dan kontrol *play, pause, resume, stop* untuk seluruh sync list.
   * *Resume* pada level ini hanya melanjutkan sub-sync (`bmd_sub_sync`) yang **belum selesai** (status bukan `success`) — sub-sync yang sudah `success` dilewati.
3. **Tabel daftar sub-sync** (level `bmd_sub_sync`): menampilkan progres per baris, yaitu per kombinasi perangkat daerah + jenis aset.
4. Pada tabel (3), user dapat **menghentikan proses per-row** — ini adalah *stop*, bukan *cancel*: data yang sudah berhasil disinkron tetap tersimpan di `bmd`, dan checkpoint (`lastProcessedRow`) tetap terjaga untuk dilanjutkan nanti.
5. Setiap row pada tabel (3) menampilkan progres granular (contoh: `500/10000` → berubah menjadi `1000/10000` seiring proses berjalan), diambil dari `successData`/`totalData` yang diperbarui per-chunk.
6. Tabel (2) dan (3) diperbarui **otomatis tanpa reload halaman** — lihat bagian Real-Time Update.
7. Ketika user menekan *stop* pada tabel (2) (level `bmd_sync`):
   * Seluruh sub-sync yang sedang `running` di bawahnya berhenti (progres berhenti bertambah), status masing-masing berubah menjadi `stopped`, checkpoint terakhir tetap tersimpan.
   * Saat user menekan *resume*, sistem mengecek tabel (3): untuk setiap sub-sync berstatus `stopped`, proses dilanjutkan dari `lastProcessedRow` masing-masing — bukan mengulang dari awal.

## Alur Proses (per sub-sync)

1. Sistem memproses sub-sync **satu per satu secara berurutan** dalam satu `bmd_sync` (tidak paralel), sesuai urutan pembuatan.
2. Untuk setiap sub-sync yang berstatus `pending` atau `stopped` dan sync list dalam kondisi *running* (bukan di-pause/stop oleh user):
   1. Set status sub-sync menjadi `running`, catat `startedAt` (jika belum ada).
   2. Ambil data dari eBMD untuk kombinasi perangkat daerah + jenis aset tersebut.
   3. Parsing response Excel menjadi baris-baris data BMD.
   4. Upsert data ke tabel `bmd` **per-chunk** (misal 500 baris). Setelah tiap chunk berhasil:
      * Update `lastProcessedRow`, `successData`/`failedData` (checkpoint + progres untuk step UI #5).
      * **Cek flag stop/pause** sebelum melanjutkan chunk berikutnya — jika user menghentikan proses (row-level atau sync-level), proses berhenti dengan bersih di batas chunk saat ini, status diubah menjadi `stopped`, dan tidak lanjut ke chunk selanjutnya.
   5. Jika terjadi error saat fetch, parsing, atau upsert (bukan karena stop manual):
      * Naikkan `retryCount`.
      * Jika `retryCount < 3`: ulangi proses sub-sync ini **dari checkpoint terakhir** (`lastProcessedRow`).
      * Jika `retryCount >= 3`: tandai status sub-sync `failed`, simpan `errorMessage`, catat `finishedAt`, lalu **lanjut ke sub-sync berikutnya** dalam urutan (tidak menghentikan `bmd_sync` secara keseluruhan).
   6. Jika seluruh data pada sub-sync berhasil diproses: tandai status `success`, catat `finishedAt`.
3. Setelah semua sub-sync mencapai status akhir (`success`, `failed`, atau `stopped` karena dihentikan user), sistem menghitung status akhir `bmd_sync`:
   * `success` — semua sub-sync `success`.
   * `partial_success` — campuran `success` dan `failed`/`stopped`.
   * `failed` — semua sub-sync `failed`.
   * `stopped` — dihentikan manual oleh user dan belum semua selesai.
4. Catat `finishedAt` pada `bmd_sync` (kecuali jika masih `stopped` dan menunggu resume).

## Status bmd_sync

```text
pending
running
paused
stopped
success
partial_success
failed
```

## Status bmd_sub_sync

```text
pending
running
stopped
success
failed
```

## Kontrol Proses (Play / Pause / Resume / Stop)

* **Play**: memulai `bmd_sync` yang masih `pending`, memproses sub-sync secara berurutan.
* **Pause** (level `bmd_sync`): meminta seluruh sub-sync yang sedang `running` untuk berhenti di batas chunk terdekat (lihat langkah 2.4 di atas), lalu sync list berstatus `paused`. Tidak mengubah data yang sudah tersimpan.
* **Resume** (level `bmd_sync`): melanjutkan hanya sub-sync yang belum `success` (status `stopped`/`failed`/`pending`), masing-masing dari checkpoint (`lastProcessedRow`) miliknya.
* **Stop per-row** (level `bmd_sub_sync`, step UI #4): menghentikan satu sub-sync tertentu tanpa mempengaruhi sub-sync lain yang sedang berjalan. Checkpoint tetap tersimpan untuk dilanjutkan kemudian.
* Perbedaan **stop vs cancel**: *stop* mempertahankan data dan checkpoint untuk dilanjutkan; sistem ini **tidak** menyediakan mekanisme *cancel* (hapus progres) kecuali diminta terpisah.

## Real-Time Update (tabel 2 dan 3)

* UI perlu mekanisme push/poll agar progres di tabel (2) dan (3) berubah otomatis tanpa reload — misalnya polling interval singkat (contoh: setiap 1–2 detik selama ada sync yang `running`) atau server-sent events/WebSocket jika arsitektur mendukung.
* Sumber data untuk update: kolom `successData`/`failedData`/`totalData`/`status` pada `bmd_sub_sync` (untuk tabel 3), dan agregatnya pada `bmd_sync` (untuk tabel 2).
* Detail pilihan teknologi (polling vs SSE vs WebSocket) belum ditentukan di dokumen ini — perlu didiskusikan sesuai arsitektur aplikasi (server action biasa vs proses background terpisah).

## Mekanisme Checkpoint & Retry

* **Checkpoint**: setiap chunk (misal 500 baris) yang berhasil di-upsert memperbarui `lastProcessedRow` pada `bmd_sub_sync`. Checkpoint dipakai baik untuk resume otomatis (setelah retry gagal) maupun resume manual (setelah user pause/stop).
* **Retry**: maksimal 3 kali per sub-sync, selalu melanjutkan dari checkpoint terakhir. `retryCount` direset ke 0 saat sub-sync pertama kali dimulai (status berubah dari `pending` ke `running`).
* **Lanjut ke sub-sync berikutnya**: jika retry ke-3 tetap gagal, sub-sync ditandai `failed` dan proses tetap berlanjut ke sub-sync selanjutnya dalam urutan — kegagalan satu sub-sync tidak menghentikan seluruh `bmd_sync`.
* Karena upsert ke `bmd` bersifat idempotent (PK `nibar`), retry maupun resume pada sub-sync yang sama tidak menimbulkan data duplikat atau korup.

## Catatan

* Sinkronisasi dilakukan **berurutan** antar sub-sync (bukan paralel), dijalankan sebagai proses long-running di laptop/VPS tanpa batasan timeout eksekusi.
* Progres diperbarui secara granular per-chunk, memungkinkan pemantauan real-time dan resume yang presisi baik untuk retry otomatis maupun kontrol manual user.
* Setiap upsert ke `bmd` sebaiknya memperbarui kolom timestamp (`updatedAt`/`lastSyncAt`) — **kolom ini belum ada di skema `bmd` saat ini dan perlu ditambahkan**.
* Riwayat sinkronisasi disimpan pada `bmd_sync` dan `bmd_sub_sync`.