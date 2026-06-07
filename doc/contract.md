# Contract Pattern

## Tujuan

Contract bertugas sebagai:

* Validasi input menggunakan Zod
* Definisi DTO
* Mapping schema database ke aplikasi
* Sumber tipe untuk Action dan Service

Contract **tidak boleh** berisi query database atau business logic.

---

## Struktur Wajib

```text
1. Import
2. Base Schema
3. Final Contract
4. Namespace Type
```

---

## Base Schema

### Select Schema

Digunakan untuk hasil query database.

```ts
const selectSchema =
  createSelectSchema(table);
```

Jika ada enum atau transformasi tambahan:

```ts
const selectSchema =
  createSelectSchema(table).extend({
    status: z.enum(STATUS),
  });
```

---

### Insert Schema

Digunakan sebagai schema dasar input.

```ts
const insertSchema =
  createInsertSchema(table);
```

Validasi field ditambahkan di sini.

```ts
const insertSchema =
  createInsertSchema(table, {
    name: (s) =>
      s.min(1, "Nama wajib diisi"),
  });
```

---

## Final Contract

### select

DTO hasil query.

```ts
select: selectSchema
```

---

### create

Input pembuatan data baru.

```ts
create: insertSchema.omit({
  id: true,
})
```

---

### update

Input perubahan data.

```ts
update:
  insertSchema
    .partial()
    .required({
      id: true,
    })
```

---

### insert

Payload penuh untuk database.

```ts
insert: insertSchema
```

Biasanya digunakan oleh Service sebelum dikirim ke Repository.

---

## Namespace Type

Selalu gunakan `z.infer`.

```ts
export namespace ExampleContract {
  export type SelectDTO =
    z.infer<
      typeof ExampleContract.select
    >;

  export type CreateDTO =
    z.infer<
      typeof ExampleContract.create
    >;

  export type UpdateDTO =
    z.infer<
      typeof ExampleContract.update
    >;

  export type InsertDTO =
    z.infer<
      typeof ExampleContract.insert
    >;
}
```

---

## Prinsip

* `select` → output database.
* `create` → input create.
* `update` → input update.
* `insert` → payload database.
* Gunakan `createSelectSchema()` untuk output.
* Gunakan `createInsertSchema()` untuk input.
* Gunakan `z.infer` untuk seluruh DTO.
* Simpan seluruh schema dalam satu object `Contract`.
* Simpan seluruh type dalam namespace `Contract`.
