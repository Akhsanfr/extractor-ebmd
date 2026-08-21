# KONSEP APLIKASI

## Project Stack

* Next.js App Router
* TypeScript
* HeroUI v3
* Drizzle ORM
* PostgreSQL
* Zod v4
* BetterAuth
* Vitest

## Core Architecture

Semua alur aplikasi wajib mengikuti pola berikut:

→ UI
→ Server Action
→ Service
→ Repository
→ Database

Larangan:

* Component tidak boleh query database langsung.
* Component tidak boleh berisi business logic.
* Action tidak boleh berisi query database.
* Repository tidak boleh berisi business rule.

## Folder Structure

```text
app/
├── layout.tsx
├── page.tsx
│
├── auth/
│   ├── layout.tsx
│   ├── login/
│   │   ├── page.tsx
│   │   └── component/
│   └── ...
│
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── [module]/
│   │   ├── page.tsx
│   │   └── component/
│   └── ...
│
└── [...non-auth]/
    ├── page.tsx
    └── component/

action/
├── [module]/
│   ├── [module].action.create.ts
│   ├── [module].action.read.ts
│   ├── [module].action.update.ts
│   ├── [module].action.delete.ts
│   ├── [module].contract.ts
│   ├── [module].service.ts
│   └── [module].repository.ts

component/
└── ...

drizzle/
├── migration/
├── schema/
└── index.ts

enum/

lib/

scripts/

types/

public/

doc/
```

## UI Structure

Folder `app` hanya berisi halaman (UI).

- `layout.tsx` → Root layout aplikasi.
- `page.tsx` → Halaman utama (`/`).
- `auth/` → Halaman autentikasi (login, register, dll.).
- `dashboard/` → Halaman yang memerlukan autentikasi (protected).
- `[...,non-auth]/` → Halaman publik selain autentikasi.

## Backend Structure

Seluruh logic backend ditempatkan pada folder `action`.

Setiap module memiliki struktur sebagai berikut:

```text
action/
└── [module]/
    ├── [module].action.create.ts
    ├── [module].action.read.ts
    ├── [module].action.update.ts
    ├── [module].action.delete.ts
    ├── [module].contract.ts
    ├── [module].repository.ts
    └── [module].service.ts
```

Keterangan:

- **Repository** → Akses database menggunakan Drizzle ORM.
- **Service** → Business logic.
- **Action** → Server Action yang dipanggil dari UI.
- **Contract** → DTO, validasi Zod, dan type.

## Component Structure

### Local Component

Component yang hanya digunakan oleh satu halaman.

Disimpan pada directory halaman yang menggunakan.

Contoh:

```text
app/dashboard/user/
├── page.tsx
├── UserForm.tsx
└── UserTable.tsx
```

### Shared Component

Component yang digunakan oleh banyak halaman.

Disimpan pada root `component/`.

Contoh:

```text
component/
├── Button/
└── ...
```

---
# KONSEP BISNIS
## Action Rules

Server Action merupakan **entry point** setiap fitur.

Action hanya bertanggung jawab untuk:

- Authorization
- Validasi input
- Memanggil Service
- Revalidate cache (jika diperlukan)
- Mengembalikan `ActionResponse`
- Menangani error melalui `handleActionError(err, actionName)`

Action **tidak boleh**:

- Berisi business logic.
- Melakukan query database secara langsung.
- Mengakses Drizzle atau SQL secara langsung.

Urutan eksekusi Action:

```
Authorization
      ↓
Validation
      ↓
Call Service
      ↓
Revalidate Cache
      ↓
Return ActionResponse
```

Seluruh proses dibungkus dalam `try...catch`.

---

### Authorization Rules

Authorization **wajib** dilakukan pada awal Action menggunakan `authorizeUser()`.

Contoh:

```ts
const user = await authorizeUser(
    await headers(),
    [RoleUser.ADMIN]
);

if (!user) {
    throw new OperationalError("Unauthorized User.");
}
```

---

### Validation Rules

Seluruh validasi input menggunakan schema pada Contract (`Zod`).

Contoh:

```ts
const validated = ProposalContract.create.safeParse(input);

if (!validated.success) {
    throw new OperationalError(
        "Validation failed",
        validated.error.flatten(
            (issue) => issue.message
        ).fieldErrors
    );
}
```

Gunakan `validated.data` sebagai input ke Service.

---

### Service Rules

Action hanya memanggil Service.

Contoh:

```ts
const proposalId = await proposalService.createProposal(
    validated.data,
    user.id
);
```

Seluruh business logic berada di Service.

---

### Cache Rules

Gunakan `revalidatePath()` apabila Action mengubah data yang digunakan oleh halaman.

Contoh:

```ts
revalidatePath(`/${modulePath}/${id}`);
```

Lakukan revalidasi setelah Service berhasil dijalankan.

### Response Rules

Seluruh Action wajib mengembalikan `ActionResponse<T>`.

Response berhasil:

```ts
return {
    success: true,
    data,
    message,
};
```

Seluruh error dikembalikan menggunakan:

```ts
return handleActionError(err, actionName);
```

Jangan membuat response error secara manual.

---

### Error Handling Rules

Seluruh Action wajib menggunakan `try...catch`.

Gunakan `OperationalError` untuk error yang diperkirakan dapat terjadi, seperti:

- Unauthorized
- Validation failed
- Data tidak ditemukan
- Data sudah ada
- Pelanggaran aturan bisnis

Seluruh error lainnya akan ditangani oleh `handleActionError(err, actionName)` sebagai `INTERNAL_ERROR`.
---

## Service Rules

Service berisi seluruh business logic.

Contoh:

proposalService.createProposal()

proposalService.updateProposal()

proposalService.submitProposal()

Service tidak boleh mengetahui:

* HeroUI
* Next.js UI
* Form
* Cache Revalidation

Service fokus pada domain bisnis.

---

## Repository Rules

Repository hanya bertanggung jawab pada:

* Query
* Insert
* Update
* Delete
* Transaction

Repository tidak boleh:

* Validasi Role
* Authorization
* Business Rule

---

## Contract & Validation Rules

### Principle

Setiap module wajib memiliki **Contract** sebagai **single source of truth** untuk seluruh DTO dan validasi menggunakan Zod.

Seluruh schema, validasi, dan type harus berasal dari Contract.

---

### Contract Structure

Gunakan object `Contract` untuk mendefinisikan seluruh schema.

Contoh:

- `create`
- `edit`
- `select`
- `selectWithProfile`
- `selectWithDetail`
- `report`
- `input`
- `output`
- `candidate`

```ts
export const UserContract = {
    create: ...,
    edit: ...,
    select: ...,
    selectWithProfile: ...,
};
```

---

### DTO Type

Seluruh DTO dibuat melalui `z.infer` di dalam namespace Contract.

```ts
export namespace UserContract {
    export type CreateDTO = z.infer<typeof UserContract.create>;
    export type EditDTO = z.infer<typeof UserContract.edit>;
    export type SelectDTO = z.infer<typeof UserContract.select>;
    export type SelectWithProfileDTO = z.infer<typeof UserContract.selectWithProfile>;
}
```

Gunakan penamaan yang konsisten, seperti:

- `CreateDTO`
- `EditDTO`
- `DeleteDTO`
- `SelectDTO`
- `ReportDTO`
- `InputDTO`
- `OutputDTO`
- `CandidateDTO`

---

### Reusable Schema

Jika suatu schema digunakan lebih dari satu kali, definisikan schema tersebut sebagai bagian dari Contract dan gunakan kembali.

```ts
export const FindMatchKodePersediaanContract = {
    candidate: ...,

    output: z.array(
        z.object({
            candidates: z.array(
                FindMatchKodePersediaanContract.candidate
            )
        })
    )
}
```

---

### Rules

- Gunakan Contract sebagai sumber DTO tunggal.
- Seluruh validasi harus berada di dalam Contract.
- Seluruh type harus dihasilkan menggunakan `z.infer`.
- Hindari membuat interface atau type yang menduplikasi schema Zod.
- Hindari mendefinisikan schema yang sama di lebih dari satu tempat.
- Gunakan schema yang sudah ada apabila memiliki struktur yang sama.
- Berikan nama schema dan DTO yang deskriptif dan konsisten sesuai fungsinya.

---


# Ownership Rules

Jika data dimiliki user:

Selalu lakukan ownership check sebelum update/delete/submit.

Contoh:

if(entity.createdBy !== user.id){
throw new OperationalError(
"Forbidden"
);
}

---

# Cache Rules

Revalidation hanya dilakukan pada Action.

Contoh:

revalidatePath("/items");
revalidatePath(`/items/${id}`);

Service tidak boleh memanggil revalidatePath.

---

# Database Rules

Semua tabel memiliki:

* id
* createdAt
* updatedAt
* deletedAt

Gunakan soft delete.

Data tidak dihapus permanen kecuali ada alasan khusus.

---

# AI Instructions

Ketika menghasilkan kode:

* Ikuti arsitektur pada dokumen ini.
* Jangan query database dari Action.
* Gunakan Contract untuk validasi.
* Gunakan Service untuk business logic.
* Gunakan Repository untuk akses database.
* Gunakan OperationalError untuk error bisnis.
* Return type action harus ActionResponse<T>.
* Ownership check wajib dilakukan pada data yang dimiliki user.
* Gunakan TypeScript strict mode.
* Prioritaskan maintainability dibanding kode yang singkat.