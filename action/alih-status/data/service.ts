import { AlihStatusDataRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusDataContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";
import { parseExcelFile } from "@/lib/xlsx/parseXlsx";
import { AlihStatusDataFormat } from "./format";

export const AlihStatusDataService = {
    async getListByPermohonanId(userId: string, permohonanId: number,): Promise<AlihStatusDataContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusDataRepository.findByPermohonanId(db, permohonanId);
    },
    async getListData(userId: string, query: AlihStatusDataContract.QueryDTO) {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusDataRepository.find(db, query);
    },

    async insert(data: AlihStatusDataContract.InsertDTO, userId: string): Promise<AlihStatusDataContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        return await AlihStatusDataRepository.insert(db, [{ ...data, createdAt: new Date(), createdBy: userId }]);
    },

    async import(data: AlihStatusDataContract.ImportDataDTO, userId: string): Promise<void> {
        const CHUNK_SIZE = 500;
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });

        const parsed = await parseExcelFile(data.data, "Alih Status");
        const formatted = AlihStatusDataFormat.import(parsed);
        const validated = AlihStatusDataContract.importItem.parse(formatted);
        console.log(formatted[0]);
        await db.transaction(async (tx) => {
            for (let i = 0; i < validated.length; i += CHUNK_SIZE) {
                const chunk = validated.slice(i, i + CHUNK_SIZE);
                await AlihStatusDataRepository.insert(tx, chunk.map((c) => ({ ...c, permohonanId: data.permohonanId, createdAt: new Date(), createdBy: userId })));
            }
        })
    },

    async update(data: AlihStatusDataContract.EditDTO, userId: string): Promise<AlihStatusDataContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        return await AlihStatusDataRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusDataContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusDataRepository.remove(db, data);
    },
};
