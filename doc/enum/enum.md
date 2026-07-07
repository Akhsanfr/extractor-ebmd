
---

### Prompt 

```text
Saya akan memberikan nama enum dan daftar item.

Tugasmu:
1. Buat `export const` object.
2. Setiap key menggunakan UPPER_SNAKE_CASE.
3. Setiap value merupakan lowercase snake_case dari key.
4. Tambahkan `as const`.
5. Buat type union dengan format:

```ts
export type NamaEnum = typeof NamaEnum[keyof typeof NamaEnum];