# Synchronization Provider - EBMD

## Pendahuluan

Dokumen ini menjelaskan implementasi sinkronisasi untuk aplikasi EBMD.

Dokumen ini hanya menjelaskan mekanisme provider EBMD.

Lifecycle Job, List, dan Batch mengikuti dokumentasi pada `SYNC.md`.

---

# Karakteristik EBMD

EBMD memiliki karakteristik sebagai berikut.

- Tidak menyediakan REST API.
- Endpoint download bersifat internal.
- Autentikasi menggunakan akun aplikasi EBMD.
- Hasil download berupa file Microsoft Excel.
- Setiap endpoint menghasilkan satu file Excel.

---

# Workflow

```
Create Job

↓

Pilih Endpoint

↓

Login EBMD

↓

Generate URL Download

↓

Download Excel

↓

Simpan File

↓

Import Excel

↓

Transform JSON

↓

Simpan Database

↓

Completed
```

---

# Detail Proses

## 1. Membuat Job

User membuat Job sinkronisasi EBMD.

---

## 2. Memilih Endpoint

Daftar endpoint bersifat fixed.

Contoh

```
KIB A

KIB B

KIB C

KIB D

KIB E

Persediaan

Aset Lainnya
```

User memilih endpoint yang akan disinkronkan.

Hasil pilihan user akan membentuk Sync List.

---

## 3. Login EBMD

Worker menggunakan akun EBMD yang telah dikonfigurasi.

Autentikasi dilakukan satu kali sebelum proses download.

---

## 4. Generate Download URL

EBMD tidak memiliki API publik.

Worker membentuk URL download berdasarkan endpoint yang dipilih.

URL tersebut kemudian digunakan untuk mengunduh file Excel.

---

## 5. Download Excel

Setiap endpoint menghasilkan satu file Excel.

File disimpan ke storage lokal.

Contoh

```
storage/

└── sync/

    └── job-10/

        ├── kib-b.xlsx

        ├── kib-c.xlsx

        └── persediaan.xlsx
```

File yang telah berhasil diunduh tidak akan diunduh ulang selama file masih tersedia.

---

## 6. Import Excel

Worker membaca file Excel dari storage.

Proses ini tidak melakukan komunikasi kembali dengan EBMD.

Tahapan:

- membaca workbook;
- membaca worksheet;
- mengubah setiap baris menjadi object JSON.

---

## 7. Simpan Database

JSON kemudian diproses menjadi entity database.

Provider bertanggung jawab melakukan:

- validasi;
- transformasi data;
- insert/update.

---

# Retry

Retry dilakukan pada proses import.

```
Storage

↓

Excel

↓

JSON

↓

Database
```

Apabila terjadi kegagalan pada proses transformasi atau penyimpanan database:

- file Excel yang telah diunduh tetap digunakan;
- worker tidak melakukan download ulang;
- retry dimulai dari file yang tersimpan di storage.

Dengan mekanisme ini, proses retry menjadi lebih cepat dan tidak membebani server EBMD.

---

# Alasan Penyimpanan File

File Excel disimpan sementara karena:

- mengurangi jumlah request ke EBMD;
- mempercepat retry;
- memudahkan debugging;
- memudahkan validasi hasil download;
- mengurangi risiko kegagalan akibat koneksi jaringan.

File dapat dihapus secara manual atau melalui mekanisme cleanup setelah proses sinkronisasi dinyatakan selesai.