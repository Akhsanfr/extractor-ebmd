# AI_CONTEXT.md

## Project Stack

* Next.js App Router
* TypeScript
* HeroUI v3
* Drizzle ORM
* PostgreSQL
* Zod
* BetterAuth/Auth.js
* Vitest

---

# Core Architecture

Semua alur aplikasi wajib mengikuti pola berikut:

UI
→ Server Action
→ Service
→ Repository
→ Database

Larangan:

* Component tidak boleh query database langsung.
* Component tidak boleh berisi business logic.
* Action tidak boleh berisi query database.
* Repository tidak boleh berisi business rule.

---

# Folder Structure

├── app/
│
├── actions/
│   └── [module]
│       ├── [module].action.create.ts
│       ├── [module].action.update.ts
│       ├── [module].action.delete.ts
│       ├── [module].action.query.ts
│       ├── [module].action.submit.ts
|       ├── [module].action.contract.ts
|       ├── [module].action.service.ts
|       └── [module].action.repository.ts
│
├── db/
│   ├── schema/
│   ├── relation/
│   └── migration/
│
├── types/
│
└── shared/

---

# Action Rules

Server Action adalah pintu masuk utama aplikasi.

Urutan dalam Action:

1. Authorization
2. Validation
3. Ownership Check
4. Call Service
5. Return ActionResponse

Contoh:

Authorization
↓
Validate Input
↓
Check Ownership
↓
Service Call
↓
Revalidate
↓
Response

Action tidak boleh melakukan query database secara langsung.

---

# Authorization Rules

Gunakan authorizeUser().

Authorization selalu dilakukan pada awal action.

Contoh:

const user = await authorizeUser(
await headers(),
[RoleUser.ADMIN]
);

Jika gagal:

throw new OperationalError("Unauthorized");

---

# Validation Rules

Semua validasi menggunakan Contract/Zod.

Contoh:

const validated =
ProposalContract.create.safeParse(input);

Jika gagal:

throw new OperationalError(
"Validation failed",
validated.error.flatten().fieldErrors
);

Jangan menggunakan manual validation.

---

# Service Rules

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

# Repository Rules

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

# DTO Rules

Gunakan Contract sebagai sumber DTO tunggal.

Contoh:

CreateDTO
EditDTO
SelectDTO
ReportDTO

Hindari membuat type yang duplikat.

---

# Error Handling Rules

Gunakan:

OperationalError

untuk error bisnis.

Gunakan:

handleActionError()

untuk semua catch block.

Contoh:

catch(error){
return handleActionError(error);
}

Jangan return error manual di banyak tempat.

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

# Naming Convention

Action

action.create.ts
action.update.ts
action.delete.ts
action.query.ts

Service

module.service.ts

Repository

module.repository.ts

Contract

module.contract.ts

Mapper

module.mapper.ts

---

# Feature Development Flow

Saat membuat modul baru:

1. Definisikan Contract
2. Buat Schema Database
3. Buat Repository
4. Buat Service
5. Buat Actions
6. Buat UI HeroUI
7. Buat Unit Test

Jangan memulai dari UI.

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
