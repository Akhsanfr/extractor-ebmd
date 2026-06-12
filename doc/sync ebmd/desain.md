# Desain Sinkronisasi BMD dari eBMD

## Tujuan

Menyalin data BMD dari eBMD ke database lokal menggunakan mekanisme sinkronisasi berdasarkan jenis BMD dan perangkat daerah.

## Tabel

### bmd

Menyimpan data master hasil sinkronisasi dari eBMD.

### bmd_sync

Menyimpan informasi proses sinkronisasi.

Contoh:

* nama sinkronisasi
* jenis BMD
* status
* waktu mulai
* waktu selesai

### bmd_sync_opd

Menyimpan daftar perangkat daerah yang akan diproses dalam suatu sinkronisasi.

Mencatat:

* perangkat daerah
* status proses
* jumlah data
* pesan error
* waktu mulai
* waktu selesai

## Relasi

```text
bmd_sync
    └── bmd_sync_opd

bmd_sync_opd
    └── sinkronisasi ke bmd
```

## Alur

1. User membuat `bmd_sync`.
2. User memilih perangkat daerah yang akan diproses.
3. Sistem membuat daftar pada `bmd_sync_opd`.
4. Sistem mengambil data eBMD per perangkat daerah.
5. Response Excel diparsing menjadi data BMD.
6. Data di-upsert ke tabel `bmd`.
7. Status dan hasil dicatat pada `bmd_sync_opd`.
8. Status akhir dicatat pada `bmd_sync`.

## Status bmd_sync

```text
pending
running
success
partial_success
failed
```

## Status bmd_sync_opd

```text
pending
running
success
failed
```

## Catatan

* Sinkronisasi dilakukan per perangkat daerah.
* Kegagalan pada satu perangkat daerah tidak menghentikan proses perangkat daerah lainnya.
* Setiap upsert memperbarui `updated_at` dan `last_sync_at` pada tabel `bmd`.
* Riwayat sinkronisasi disimpan pada `bmd_sync` dan `bmd_sync_opd`.

```
```
