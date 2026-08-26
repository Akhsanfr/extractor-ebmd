import { AlihStatusPersetujuanBupatiRepository } from "./repository";
import { db } from "@/drizzle";
import { AlihStatusPersetujuanBupatiContract } from "./contract";
import { verifyPermissions } from "@/lib/auth/auth";

export const AlihStatusPersetujuanBupatiService = {
    async getByGroupId(groupId: number, userId: string): Promise<AlihStatusPersetujuanBupatiContract.SelectDTO> {
        await verifyPermissions(userId, {
            "alih-status": ["read"]
        });
        return AlihStatusPersetujuanBupatiRepository.findByGroupId(db, groupId);
    },

    async insert(data: AlihStatusPersetujuanBupatiContract.InsertDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["create"]
        });
        await AlihStatusPersetujuanBupatiRepository.insert(db, { ...data, createdAt: new Date(), createdBy: userId });
    },

    async update(data: AlihStatusPersetujuanBupatiContract.EditDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["update"]
        });
        await AlihStatusPersetujuanBupatiRepository.update(db, { ...data, updatedAt: new Date(), updatedBy: userId });
    },

    async remove(data: AlihStatusPersetujuanBupatiContract.DeleteDTO, userId: string): Promise<void> {
        await verifyPermissions(userId, {
            "alih-status": ["delete"]
        });
        await AlihStatusPersetujuanBupatiRepository.remove(db, { ...data, deletedAt: new Date(), deletedBy: userId });
    },
};
