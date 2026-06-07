# Repository Pattern Guide

## Tujuan

Repository hanya bertanggung jawab terhadap akses database.

Repository **tidak boleh** berisi:

* Validasi bisnis
* Validasi Zod
* Permission checking
* Error handling bisnis

---

## Aturan

### 1. Hanya menerima tipe Drizzle

```ts
create(
  dbOrTx: DbOrTx,
  data: InsertKodeBarang
)
```

Jangan menerima DTO dari Contract.

---

### 2. Selalu menerima dbOrTx

```ts
getById(
  dbOrTx: DbOrTx,
  id: number
)
```

Agar dapat digunakan pada:

* Database biasa
* Transaction

---

### 3. Query per fungsi

Contoh:

```ts
getById()
getByKode()
create()
update()
softDelete()
```

Satu fungsi = satu tujuan query.

---

### 4. Return native database type

```ts
Promise<SelectKodeBarang>
```

atau

```ts
Promise<SelectKodeBarang[]>
```

---

### 5. Tidak throw business error

❌ Salah

```ts
if (!result) {
  throw new Error("Data tidak ditemukan");
}
```

✅ Benar

```ts
return result;
```

Service yang memutuskan error.

---

### Struktur Umum

```text
Repository
├── getAll()
├── getById()
├── create()
├── update()
└── softDelete()
```
