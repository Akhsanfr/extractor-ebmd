import { rekonTable } from "@/drizzle/schema";
import { RekonType } from "@/enum/rekon";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
z.config(z.locales.id());

const tahun = z.number().int().positive();
const bulan = z.number().int().min(1).max(12);
const nominal = z.number().finite();

// Dokumen per baris rekon. Keduanya independen satu sama lain.
const berkasTipe = z.enum(["kertasKerja", "ba"]);
const berkasTarget = z.object({
    id: z.number().int().positive(),
    tipe: berkasTipe,
});

export const RekonContract = {
    query: z.object({
        tahun,
        bulan,
        pic: z.string().optional(),
        perangkatDaerahId: z.number().int().positive().optional(),
        rekonType: z.enum(RekonType).optional(),
    }),
    select: createSelectSchema(rekonTable).extend({ rekonType: z.enum(RekonType) }),
    // Dipakai tabel: baris rekon + nama perangkat daerah (join ke masterPerangkatDaerah).
    selectWithPerangkatDaerah: createSelectSchema(rekonTable).extend({
        perangkatDaerahNama: z.string(),
        rekonType: z.enum(RekonType),
    }),

    // Buat satu baris rekon. inputBMD tidak diisi di sini: baris baru selalu mulai dari 0.
    create: createInsertSchema(rekonTable)
        .pick({
            tahun: true,
            bulan: true,
            perangkatDaerahId: true,
            realisasiAnggaran: true,
            pic: true,
            nomorBA: true,
        })
        .extend({ tahun, bulan, rekonType: z.enum(RekonType) }),

    // Dipakai repository (initiate, import, create). realisasiAnggaran, pic, nomorBA: null = belum diisi.
    insert: createInsertSchema(rekonTable)
        .pick({
            tahun: true,
            bulan: true,
            perangkatDaerahId: true,
            realisasiAnggaran: true,
            inputBMD: true,
            pic: true,
            nomorBA: true,
        })
        .extend({ tahun, bulan, rekonType: z.enum(RekonType) }),

    // Inisiasi: OPD + tahun + bulan -> satu baris per jenis rekon.
    initiate: z.object({
        tahun,
        bulan,
        perangkatDaerahId: z.number().int().positive(),
    }),

    importItem: z
        .object({
            perangkatDaerah: z.string().min(1),
            picAsetTetap: z.string().nullable(),
            picPersediaan: z.string().nullable(),
            picPemeliharaan: z.string().nullable(),
            nomorBA: z.string().nullable(),
            asetTetap: z.number().nullable(),
            persediaan: z.number().nullable(),
            pemeliharaan: z.number().nullable(),
            originalIndex: z.number(),
        })
        .array(),

    importData: z.object({
        data: z.instanceof(File),
        tahun,
        bulan,
    }),

    edit: z.object({
        id: z.number().int().positive(),
        realisasiAnggaran: nominal.nullable(),
        pic: z.string().nullable(),
        nomorBA: z.string().nullable(),
        keterangan: z.string().nullable(),
        inputBMD: nominal,
    }),
    update: z.object({
        id: z.number().int().positive(),
        inputBMD: nominal,
        realisasiAnggaran: nominal.nullable(),
        pic: z.string().nullable(),
        nomorBA: z.string().nullable(),
        keterangan: z.string().nullable(),
        updatedAt: z.date(),
    }),

    delete: z.object({ id: z.number().int().positive() }),
    remove: z.object({ id: z.number().int().positive() }),

    // --- Berkas (kertas kerja .xlsx & berita acara .pdf) ---
    // kertasKerjaId/baId sudah ikut di `select` & `selectWithPerangkatDaerah` (createSelectSchema),
    // dan sengaja TIDAK ada di `edit`/`update`/`importItem`/`insert`, jadi edit nominal dan
    // import tidak bisa menyentuh key berkas.
    berkasTipe,
    berkasTarget,
    updateBerkas: berkasTarget.extend({ key: z.string().min(1).max(512) }),
};

export namespace RekonContract {
    export type QueryDTO = z.infer<typeof RekonContract.query>;
    export type SelectDTO = z.infer<typeof RekonContract.select>;
    export type SelectWithPerangkatDaerahDTO = z.infer<typeof RekonContract.selectWithPerangkatDaerah>;
    export type CreateDTO = z.infer<typeof RekonContract.create>;
    export type InsertDTO = z.infer<typeof RekonContract.insert>;
    export type InitiateDTO = z.infer<typeof RekonContract.initiate>;
    export type ImportItemDTO = z.infer<typeof RekonContract.importItem>;
    export type ImportDataDTO = z.infer<typeof RekonContract.importData>;
    export type EditDTO = z.infer<typeof RekonContract.edit>;
    export type UpdateDTO = z.infer<typeof RekonContract.update>;
    export type DeleteDTO = z.infer<typeof RekonContract.delete>;
    export type RemoveDTO = z.infer<typeof RekonContract.remove>;
    export type BerkasTipe = z.infer<typeof RekonContract.berkasTipe>;
    export type BerkasTargetDTO = z.infer<typeof RekonContract.berkasTarget>;
    export type UpdateBerkasDTO = z.infer<typeof RekonContract.updateBerkas>;
    export type ResultBerkasDTO = { id: number; tipe: BerkasTipe; key: string };
}