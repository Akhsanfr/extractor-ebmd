# Service Pattern Guide

## Tujuan

Service bertanggung jawab terhadap business logic aplikasi.

Service menjadi penghubung antara:

```text
Action
 ↓
Service
 ↓
Repository
 ↓
Database
```

---

## Tanggung Jawab

### 1. Validasi bisnis

```ts
const existing =
  await repository.getByKode(...);

if (existing) {
  throw new Error("Kode sudah ada");
}
```

---

### 2. Mapping DTO → Database Type

```ts
function toInsert(
  data: CreateDTO
): InsertKodeBarang {
  return data as InsertKodeBarang;
}
```

Repository tidak boleh menerima DTO.

---

### 3. Orkestrasi Repository

```ts
const existing =
  await repository.getById(...);

await repository.update(...);
```

Service boleh memanggil beberapa repository.

---

### 4. Error Handling

```ts
if (!existing) {
  throw new Error(
    "Data tidak ditemukan"
  );
}
```

---

### 5. Transaction Management

Jika diperlukan.

```ts
await db.transaction(async (tx) => {
  ...
});
```

---

## Yang Tidak Boleh

❌ Query database langsung

```ts
db.select(...)
```

Gunakan Repository.

---

❌ Validasi Zod

```ts
schema.parse(...)
```

Dilakukan di Action.

---

## Struktur Umum

```text
Service
├── getAll()
├── getById()
├── create()
├── update()
├── delete()
└── businessProcess()
```

---

## Alur Data

```text
Action
  ↓
Contract (Zod)
  ↓
Service
  ↓
Repository
  ↓
Database
```

---

## Prinsip

* Repository = akses data.
* Service = aturan bisnis.
* Contract = validasi data.
* Action = entry point.
* Database type tidak keluar dari Repository.
* DTO tidak masuk ke Repository.
