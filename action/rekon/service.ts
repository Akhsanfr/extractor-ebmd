import { RekonRepository } from "./repository";
import { db } from "@/drizzle";
import { RekonContract } from "./contract";
import { OperationalError } from "@/action/actionResponse";
import { parseExcelFile } from "@/lib/xlsx/parseXlsx";
import { RekonFormat } from "./format";
import { RekonType } from "@/enum/rekon";
// TODO(auth): aktifkan kembali bersama pemeriksaan permission di bawah.
// import { verifyPermissions } from "@/lib/auth/auth";

// TODO(auth): auth dinonaktifkan sementara untuk modul rekon. Saat diaktifkan kembali:
//  1. tambahkan parameter `userId: string` ke tiap method (seperti AlihStatusPermohonanService),
//  2. buka komentar verifyPermissions, dan daftarkan resource "rekon" di access control,
//  3. aktifkan pemeriksaan sesi di action.*.ts.

const normalizeName = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

export const RekonService = {
    async get(id: number): Promise<RekonContract.SelectDTO> {
        // TODO(auth): await verifyPermissions(userId, { rekon: ["read"] });
        return RekonRepository.findById(db, id);
    },

    async getList(query: RekonContract.QueryDTO): Promise<RekonContract.SelectWithPerangkatDaerahDTO[]> {
        // TODO(auth): await verifyPermissions(userId, { rekon: ["read"] });
        return RekonRepository.find(db, query);
    },

    async insert(data: RekonContract.CreateDTO): Promise<RekonContract.SelectDTO> {
        // TODO(auth): await verifyPermissions(userId, { rekon: ["create"] });
        const existing = await RekonRepository.findByKey(db, data);
        if (existing) {
            throw new OperationalError(
                `Data rekon ${data.rekonType} untuk ${data.bulan}/${data.tahun} dan perangkat daerah ini sudah ada`,
            );
        }
        return await RekonRepository.insert(db, { ...data, inputBMD: 0 });
    },

    // Inisiasi: siapkan satu baris per jenis rekon untuk OPD + tahun + bulan.
    // Aman dipanggil berulang: baris yang sudah ada (termasuk inputBMD-nya) tidak berubah.
    async initiate(data: RekonContract.InitiateDTO): Promise<RekonContract.SelectWithPerangkatDaerahDTO[]> {
        // TODO(auth): await verifyPermissions(userId, { rekon: ["create"] });
        return await db.transaction(async (tx) => {
            await RekonRepository.insertIgnore(
                tx,
                Object.values(RekonType).map((rekonType) => ({
                    tahun: data.tahun,
                    bulan: data.bulan,
                    perangkatDaerahId: data.perangkatDaerahId,
                    rekonType,
                    realisasiAnggaran: 0,
                    inputBMD: 0,
                })),
            );
            return RekonRepository.find(tx, {
                tahun: data.tahun,
                bulan: data.bulan,
                perangkatDaerahId: data.perangkatDaerahId,
            });
        });
    },

    async import(data: RekonContract.ImportDataDTO): Promise<void> {
        const CHUNK_SIZE = 500;
        // TODO(auth): await verifyPermissions(userId, { rekon: ["create"] });

        // ASUMSI: nama sheet "rekon" (di referensi: "Alih Status"). Sesuaikan dengan template Excel.
        const parsed = await parseExcelFile(data.data, "rekon");
        const formatted = RekonFormat.import(parsed);
        const validated = RekonContract.importItem.parse(formatted);
        if (validated.length === 0) {
            throw new OperationalError("File tidak berisi data");
        }

        // Cocokkan nama OPD sebelum membuka transaksi, supaya error langsung jelas.
        const opdList = await RekonRepository.findAllPerangkatDaerah(db);
        const opdIdByName = new Map(opdList.map((o) => [normalizeName(o.nama), o.id]));

        const notFound: string[] = [];
        const duplicated: string[] = [];
        const seen = new Set<number>();
        const rows: RekonContract.InsertDTO[] = [];

        for (const item of validated) {
            const perangkatDaerahId = opdIdByName.get(normalizeName(item.perangkatDaerah));
            const label = `${item.perangkatDaerah} (data ke-${item.originalIndex + 1})`;
            if (perangkatDaerahId === undefined) {
                notFound.push(label);
                continue;
            }
            if (seen.has(perangkatDaerahId)) {
                duplicated.push(label);
                continue;
            }
            seen.add(perangkatDaerahId);

            const realisasi = {
                [RekonType.ASET_TETAP]: item.asetTetap,
                [RekonType.PERSEDIAAN]: item.persediaan,
                [RekonType.PEMELIHARAAN]: item.pemeliharaan,
            } satisfies Record<RekonType, number>;

            for (const rekonType of Object.values(RekonType)) {
                rows.push({
                    tahun: data.tahun,
                    bulan: data.bulan,
                    perangkatDaerahId,
                    rekonType,
                    realisasiAnggaran: realisasi[rekonType],
                    inputBMD: 0, // hanya untuk baris baru
                });
            }
        }

        if (notFound.length > 0) {
            throw new OperationalError(
                `Perangkat daerah tidak ditemukan di master: ${notFound.join(", ")}`,
            );
        }
        if (duplicated.length > 0) {
            throw new OperationalError(
                `Perangkat daerah muncul lebih dari satu kali di file: ${duplicated.join(", ")}`,
            );
        }

        await db.transaction(async (tx) => {
            for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
                await RekonRepository.upsertRealisasi(tx, rows.slice(i, i + CHUNK_SIZE));
            }
        });
    },

    async update(data: RekonContract.EditDTO): Promise<RekonContract.SelectDTO> {
        // TODO(auth): await verifyPermissions(userId, { rekon: ["update"] });
        return await RekonRepository.update(db, { ...data, updatedAt: new Date() });
    },

    async remove(data: RekonContract.DeleteDTO): Promise<void> {
        // TODO(auth): await verifyPermissions(userId, { rekon: ["delete"] });
        await RekonRepository.remove(db, data);
    },
};
