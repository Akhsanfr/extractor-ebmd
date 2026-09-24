export const UserRole = {
    ADMIN: "admin",
    ADMIN_OPD: "admin-opd",
    USER: "user"
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const PegawaiPangkatGolongan = {
    IV_E: "Pembina Utama (IV/e)",
    IV_D: "Pembina Utama Madya (IV/d)",
    IV_C: "Pembina Utama Muda (IV/c)",
    IV_B: "Pembina Tingkat I (IV/b)",
    IV_A: "Pembina (IV/a)",

    III_D: "Penata Tingkat I (III/d)",
    III_C: "Penata (III/c)",
    III_B: "Penata Muda Tingkat I (III/b)",
    III_A: "Penata Muda (III/a)",

    II_D: "Pengatur Tingkat I (II/d)",
    II_C: "Pengatur (II/c)",
    II_B: "Pengatur Muda Tingkat I (II/b)",
    II_A: "Pengatur Muda (II/a)",

    I_D: "Juru Tingkat I (I/d)",
    I_C: "Juru (I/c)",
    I_B: "Juru Muda Tingkat I (I/b)",
    I_A: "Juru Muda (I/a)",
} as const;

export type PegawaiPangkatGolongan =
    typeof PegawaiPangkatGolongan[
    keyof typeof PegawaiPangkatGolongan
    ];