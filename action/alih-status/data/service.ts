import { AlihStatusDataRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusDataContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";
import { parseExcelFile } from "@/lib/xlsx/parseXlsx";
import { AlihStatusDataFormat } from "./format";

export const AlihStatusDataService = {
    async getListByMasterId(userId: string, masterIds: number[]): Promise<AlihStatusDataContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusDataRepository.findByMasterIds(db, masterIds);
    },

    async insert(data: AlihStatusDataContract.InsertDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        await AlihStatusDataRepository.insert(db, [{ ...data, createdAt: new Date(), createdBy: userId }]);
    },

    async import(data: AlihStatusDataContract.ImportDataDTO, userId: string): Promise<void> {
        const CHUNK_SIZE = 500;
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });

        const parsed = await parseExcelFile(data.data, "Sheet1");
        const formatted = AlihStatusDataFormat.import(parsed);
        const validated = AlihStatusDataContract.importItem.parse(formatted);

        await db.transaction(async (tx) => {
            for (let i = 0; i < validated.length; i += CHUNK_SIZE) {
                const chunk = validated.slice(i, i + CHUNK_SIZE);
                await AlihStatusDataRepository.insert(tx, chunk.map((c) => ({ ...c, masterId: data.masterId, createdAt: new Date(), createdBy: userId })));
            }
        })
    },

    async update(data: AlihStatusDataContract.EditDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        await AlihStatusDataRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusDataContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusDataRepository.remove(db, { ...data, deletedAt: new Date(), deletedBy: userId });
    },
};
