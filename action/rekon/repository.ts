import { and, asc, eq, getTableColumns, sql } from "drizzle-orm";
import { RekonContract } from "./contract";
import { DbOrTx } from "../baseDbOrTx";
import { masterPerangkatDaerah, rekonTable } from "@/drizzle/schema";
import { OperationalError } from "@/action/actionResponse";

// Kunci logis satu baris rekon. Butuh unique constraint di DB (lihat SCHEMA_CHANGE.md).
const conflictTarget = [
    rekonTable.tahun,
    rekonTable.bulan,
    rekonTable.rekonType,
    rekonTable.perangkatDaerahId,
];

export const RekonRepository = {
    async findById(db: DbOrTx, id: number): Promise<RekonContract.SelectDTO> {
        const [res] = await db
            .select()
            .from(rekonTable)
            .where(eq(rekonTable.id, id))
            .limit(1);
        if (!res) {
            throw new OperationalError(`Data rekon dengan id ${id} tidak ditemukan`);
        }
        return res;
    },

    async findByKey(
        db: DbOrTx,
        key: Pick<RekonContract.SelectDTO, "tahun" | "bulan" | "rekonType" | "perangkatDaerahId">,
    ): Promise<RekonContract.SelectDTO | undefined> {
        const [res] = await db
            .select()
            .from(rekonTable)
            .where(
                and(
                    eq(rekonTable.tahun, key.tahun),
                    eq(rekonTable.bulan, key.bulan),
                    eq(rekonTable.rekonType, key.rekonType),
                    eq(rekonTable.perangkatDaerahId, key.perangkatDaerahId),
                ),
            )
            .limit(1);
        return res;
    },

    async find(
        db: DbOrTx,
        query: RekonContract.QueryDTO,
    ): Promise<RekonContract.SelectWithPerangkatDaerahDTO[]> {
        const conditions = [
            eq(rekonTable.tahun, query.tahun),
            eq(rekonTable.bulan, query.bulan),
        ];
        if (query.perangkatDaerahId !== undefined) {
            conditions.push(eq(rekonTable.perangkatDaerahId, query.perangkatDaerahId));
        }
        if (query.rekonType !== undefined) {
            conditions.push(eq(rekonTable.rekonType, query.rekonType));
        }
        return await db
            .select({
                ...getTableColumns(rekonTable),
                perangkatDaerahNama: masterPerangkatDaerah.nama,
            })
            .from(rekonTable)
            .innerJoin(masterPerangkatDaerah, eq(rekonTable.perangkatDaerahId, masterPerangkatDaerah.id))
            .where(and(...conditions))
            .orderBy(asc(masterPerangkatDaerah.nama), asc(rekonTable.id));
    },

    async insert(db: DbOrTx, data: RekonContract.InsertDTO): Promise<RekonContract.SelectDTO> {
        const res = await db.insert(rekonTable).values(data).returning();
        return res[0];
    },

    // Dipakai inisiasi: baris yang sudah ada dibiarkan apa adanya (idempoten).
    async insertIgnore(db: DbOrTx, data: RekonContract.InsertDTO[]): Promise<RekonContract.SelectDTO[]> {
        if (data.length === 0) return [];
        return await db
            .insert(rekonTable)
            .values(data)
            .onConflictDoNothing({ target: conflictTarget })
            .returning();
    },

    // Dipakai import: baris baru dibuat, baris lama hanya diperbarui realisasiAnggaran-nya.
    // inputBMD sengaja tidak ada di `set`, jadi nilai yang sudah diisi tidak tertimpa.
    // Catatan: satu statement tidak boleh memuat kunci yang sama dua kali (dicek di service).
    async upsertRealisasi(db: DbOrTx, data: RekonContract.InsertDTO[]): Promise<void> {
        if (data.length === 0) return;
        await db
            .insert(rekonTable)
            .values(data)
            .onConflictDoUpdate({
                target: conflictTarget,
                set: {
                    realisasiAnggaran: sql`excluded.${sql.identifier(rekonTable.realisasiAnggaran.name)}`,
                    updatedAt: new Date(),
                },
            });
    },

    // Hanya inputBMD (dan updatedAt) yang diubah; realisasiAnggaran tidak disentuh.
    async update(db: DbOrTx, data: RekonContract.UpdateDTO): Promise<RekonContract.SelectDTO> {
        const { id, inputBMD, updatedAt } = data;
        const res = await db
            .update(rekonTable)
            .set({ inputBMD, updatedAt })
            .where(eq(rekonTable.id, id))
            .returning();
        if (!res[0]) {
            throw new OperationalError(`Data rekon dengan id ${id} tidak ditemukan`);
        }
        return res[0];
    },

    // Hanya key berkas (dan updatedAt) yang diubah; nominal tidak disentuh.
    // Patch hanya memuat kolom milik satu dokumen, jadi dokumen lain tidak ikut berubah.
    async updateBerkasKeys(
        db: DbOrTx,
        id: number,
        patch: Partial<Pick<RekonContract.SelectDTO, "kertasKerjaId" | "baId">>,
    ): Promise<RekonContract.SelectDTO> {
        const res = await db
            .update(rekonTable)
            .set({ ...patch, updatedAt: new Date() })
            .where(eq(rekonTable.id, id))
            .returning();
        if (!res[0]) {
            throw new OperationalError(`Data rekon dengan id ${id} tidak ditemukan`);
        }
        return res[0];
    },

    // Tabel rekon tidak punya kolom deletedAt/deletedBy, jadi ini hard delete.
    async remove(db: DbOrTx, data: RekonContract.RemoveDTO): Promise<void> {
        await db.delete(rekonTable).where(eq(rekonTable.id, data.id));
    },

    // Untuk mencocokkan nama OPD dari Excel. ASUMSI: kolom nama = masterPerangkatDaerah.nama
    async findAllPerangkatDaerah(db: DbOrTx): Promise<{ id: number; nama: string }[]> {
        return await db
            .select({ id: masterPerangkatDaerah.id, nama: masterPerangkatDaerah.nama })
            .from(masterPerangkatDaerah);
    },
};