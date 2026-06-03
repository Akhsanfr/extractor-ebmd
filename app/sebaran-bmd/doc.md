# Tool BMD - Modul Digitasi Tanah dan Export KML

## 1. Latar Belakang

Aplikasi digunakan untuk mengelola hasil digitasi bidang tanah Barang Milik Daerah (BMD) yang diperoleh dari Bhumi ATR/BPN. Hasil digitasi disimpan ke database dan dapat diekspor menjadi satu file KML untuk kebutuhan visualisasi pada Google Earth maupun aplikasi GIS lainnya.

---

# 2. Alur Proses Bisnis

## 2.1 Digitasi Tanah

1. Pengguna membuka aplikasi Bhumi ATR/BPN.
2. Pengguna melakukan digitasi bidang tanah.
3. Pengguna mengunduh hasil digitasi dalam format GeoJSON.
4. Pengguna membuka aplikasi Tool BMD.
5. Pengguna memilih NIBAR yang akan diperbarui.
6. Pengguna mengunggah file GeoJSON.
7. Sistem membaca geometri dari file GeoJSON.
8. Sistem memperbarui data BMD pada database.
9. Sistem menampilkan notifikasi berhasil atau gagal.

---

## 2.2 Export KML

1. Sistem mengambil seluruh data BMD yang memiliki polygon.
2. Sistem membentuk struktur KML.
3. Setiap bidang tanah menjadi satu Placemark.
4. Sistem menghasilkan satu file KML yang berisi seluruh bidang tanah.
5. Pengguna mengunduh file KML.

---

# 3. Struktur Data

## Tabel BMD

| Kolom      | Tipe                        | Keterangan                       |
| ---------- | --------------------------- | -------------------------------- |
| nibar      | varchar                     | Nomor Identitas Barang           |
| polygon    | geometry(MultiPolygon,4326) | Geometri bidang tanah            |
| hak        | text                        | Status hak tanah                 |
| nomor      | text                        | Nomor sertifikat/dokumen         |
| desa       | text                        | Nama desa/kelurahan              |
| updated_by | text                        | User terakhir yang mengubah data |
| pic        | text                        | Penanggung jawab data            |
| updated_at | timestamp                   | Waktu pembaruan                  |

---

# 4. Upload GeoJSON

## 4.1 Prasyarat

* Database sudah memiliki daftar NIBAR.
* Pengguna hanya mengunggah file GeoJSON.

---

## 4.2 Alur Upload

### Daftar Barang

Pengguna melihat daftar NIBAR pada tabel.

### Pilih Barang

Pengguna menekan tombol:

```text
Upload Polygon
```

pada salah satu baris.

### Modal Upload

Modal menampilkan:

```text
NIBAR : 01.01.01.001

[ Pilih File GeoJSON ]
```

Komponen:

* NIBAR (readonly)
* Input file GeoJSON

---

### Setelah File Dipilih

Sistem secara otomatis:

1. Membaca file GeoJSON.
2. Memvalidasi struktur GeoJSON.
3. Mengambil geometry Polygon atau MultiPolygon.
4. Mengonversi menjadi geometry PostGIS.
5. Menyimpan ke tabel BMD.
6. Mengisi:

   * polygon
   * updated_by
   * updated_at

---

### Jika Berhasil

Modal otomatis ditutup.

Tampilkan toast:

```text
Berhasil memperbarui polygon untuk NIBAR 01.01.01.001
```

---

### Jika Gagal

Modal tetap terbuka.

Tampilkan toast:

```text
Gagal mengunggah GeoJSON:
Format file tidak valid.
```

---

# 5. Dashboard

## 5.1 Statistik

Menampilkan kartu statistik.

### Total Barang

```text
1.245
```

### Sudah Digitasi

```text
980
```

### Belum Digitasi

```text
265
```

### Progress

```text
78.71%
```

---

## 5.2 Statistik per PIC

| PIC   | Total | Sudah | Belum |
| ----- | ----- | ----- | ----- |
| Ahmad | 100   | 90    | 10    |
| Budi  | 120   | 85    | 35    |
| Siti  | 80    | 60    | 20    |

---

# 6. Tabel Data

## Fitur

### Filter PIC

Dropdown:

```text
Semua PIC
Ahmad
Budi
Siti
```

---

### Filter Status Polygon

Dropdown:

```text
Semua
Sudah Digitasi
Belum Digitasi
```

---

### Pencarian

Pencarian berdasarkan:

* NIBAR
* Nomor
* Desa

---

### Pagination

Contoh:

```text
Menampilkan 1 - 20 dari 1.245 data
```

---

## Kolom Tabel

| NIBAR | Hak | Nomor | Desa | PIC | Status | Aksi |
| ----- | --- | ----- | ---- | --- | ------ | ---- |

Status:

* Sudah Digitasi
* Belum Digitasi

Aksi:

* Upload Polygon
* Lihat Polygon

---

# 7. Export KML

## Tombol

```text
Export KML
```

---

## Struktur KML

Setiap record menjadi:

```xml
<Placemark>
    <name>NIBAR</name>

    <ExtendedData>
        <Data name="hak">
            <value>Hak Pakai</value>
        </Data>

        <Data name="nomor">
            <value>123/ABC</value>
        </Data>

        <Data name="desa">
            <value>Desa Sukamaju</value>
        </Data>

        <Data name="pic">
            <value>Ahmad</value>
        </Data>
    </ExtendedData>

    <MultiPolygon>
        ...
    </MultiPolygon>
</Placemark>
```

---

## Nama File

Format:

```text
bmd-tanah-YYYYMMDD.kml
```

Contoh:

```text
bmd-tanah-20260603.kml
```

---

# 8. Validasi

## Upload

* Hanya menerima file `.geojson`
* Maksimal 10 MB
* Harus memiliki geometry Polygon atau MultiPolygon
* GeoJSON tidak boleh kosong

## Database

* NIBAR wajib ada
* Polygon wajib valid
* Polygon wajib tersimpan dalam SRID 4326

---

# 9. Teknologi

## Frontend

* Next.js
* HeroUI V3

## Backend

* Next.js Server Actions
* Drizzle ORM
* PostgreSQL + PostGIS

## GIS

* PostGIS
* GeoJSON
* KML
