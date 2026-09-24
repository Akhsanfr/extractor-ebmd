import { pgEnum } from "drizzle-orm/pg-core";
import { StatusBhumi } from "./../../enum/sebaranBmd";
import { BmdSyncStatus, BmdSubSyncStatus } from "./../../enum/bmdSync";
import { BmdAssetType } from "./../../enum/bmd";
import { EmbeddingStatus } from "./../../enum/embedding";
import { UserRole } from "./../../enum/user";
import { SyncJobType, SyncStatus } from "./../../enum/sync";
import { AlihStatusType } from "@/enum/alihStatus";

export const sebaranBmdStatusBhumiEnum = pgEnum("sebaran_bmd_status_bhumi", StatusBhumi);
export const bmdSyncStatusEnum = pgEnum("bmd_sync_status", BmdSyncStatus);
export const bmdSubSyncStatusEnum = pgEnum("bmd_sub_sync_status", BmdSubSyncStatus);
export const bmdAssetTypeEnum = pgEnum("bmd_asset_type", BmdAssetType);
export const embeddingStatusEnum = pgEnum("embedding_status", EmbeddingStatus);
export const userRoleEnum = pgEnum("user_role_enum", UserRole);


export const syncStatusEnum = pgEnum("sync_status", SyncStatus);
export const syncJobTypeEnum = pgEnum("job_type", SyncJobType);


export const alihStatusTypeEnum = pgEnum("alih_status_type", AlihStatusType);
