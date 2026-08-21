# Synchronization Framework

## Pendahuluan

Synchronization Framework merupakan modul umum (generic synchronization engine) yang digunakan untuk melakukan sinkronisasi data dari berbagai sumber aplikasi ke database lokal.

Framework ini tidak bergantung pada jenis aplikasi tertentu. Setiap aplikasi (misalnya EBMD, SIMPEG, SIPD, dan lainnya) memiliki mekanisme sinkronisasi masing-masing, namun seluruh proses dijalankan menggunakan workflow yang sama.

## Tujuan

- Menyediakan mekanisme sinkronisasi yang reusable.
- Mendukung berbagai sumber data.
- Mendukung proses retry.
- Mendukung worker asynchronous.
- Mendukung monitoring progress sinkronisasi.
- Memisahkan proses download data dan proses import data.

---

# Konsep

Framework terdiri dari tiga level pekerjaan.

```
Sync Job
    │
    ├── Sync List
    │       │
    │       ├── Sync Batch
    │       ├── Sync Batch
    │       └── Sync Batch
    │
    └── Sync List
            │
            ├── Sync Batch
            └── Sync Batch
```

## Sync Job

Merupakan satu pekerjaan sinkronisasi.

Contoh

- Sinkronisasi EBMD
- Sinkronisasi SIMPEG
- Sinkronisasi SIPD

Status

- Pending
- Processing
- Completed
- Failed
- Cancelled

---

## Sync List

Merupakan daftar endpoint/resource yang akan diproses pada suatu Job.

Contoh

```
Job
│
├── Barang
├── Kategori
├── Pegawai
└── Rekening
```

Setiap Sync List dijalankan secara independen sehingga kegagalan pada satu endpoint tidak menghentikan endpoint lainnya.

---

## Sync Batch

Merupakan unit pekerjaan terkecil.

Jika suatu endpoint memiliki data yang besar maka worker dapat membaginya menjadi beberapa batch.

Contoh

```
Barang

Batch 1
Batch 2
Batch 3
...
Batch N
```

Batch merupakan unit retry.

---

# Workflow

Secara umum workflow sinkronisasi adalah sebagai berikut.

```
Create Job

↓

Generate Sync List

↓

Generate Batch

↓

Worker Process

↓

Save Result

↓

Update Status
```

---

# Retry

Retry dilakukan pada level Batch.

Apabila terjadi kegagalan ketika memproses suatu batch maka worker hanya mengulangi batch tersebut tanpa mengulang batch yang telah berhasil.

Implementasi retry masing-masing provider dapat berbeda.

---

# Provider

Framework bersifat generic.

Implementasi sinkronisasi dilakukan oleh Provider.

Contoh provider

- EBMD
- SIMPEG
- SIPD
- Persediaan

Masing-masing provider bertanggung jawab terhadap:

- autentikasi
- pengambilan data
- parsing data
- penyimpanan data
- mekanisme retry

Framework hanya mengatur lifecycle Job, List, dan Batch.

---

# Penyimpanan Resource

Framework memperbolehkan provider menyimpan resource hasil download sebelum diproses.

Keuntungan:

- tidak perlu melakukan download ulang ketika proses import gagal;
- proses parsing dapat dijalankan berulang;
- memudahkan debugging.