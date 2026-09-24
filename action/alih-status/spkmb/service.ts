import { AlihStatusSpkmbRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusSPKMBContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";
import { AlihStatusDataRepository } from "../data/repository";

export const AlihStatusSpkmbService = {
    async getList(userId: string, ids: number[]): Promise<AlihStatusSPKMBContract.SelectDTO[]> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusSpkmbRepository.findByIds(db, ids);
    },

    async insert(userId: string, data: AlihStatusSPKMBContract.InsertDTO,): Promise<AlihStatusSPKMBContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        return await db.transaction(async (tx) => {
            const res = await AlihStatusSpkmbRepository.insert(tx, { ...data, createdAt: new Date(), createdBy: userId });
            if (res.id === undefined) throw new Error("Gagal membuat data SPKMB")
            await AlihStatusDataRepository.link(tx, data.dataIds, { spkmbId: res.id })
            return res;
        })
    },

    async update(data: AlihStatusSPKMBContract.EditDTO, userId: string): Promise<AlihStatusSPKMBContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        return await AlihStatusSpkmbRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusSPKMBContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusSpkmbRepository.remove(db, { ...data });
    },
};
