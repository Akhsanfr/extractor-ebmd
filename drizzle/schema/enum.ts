import { pgEnum } from "drizzle-orm/pg-core";
import { StatusBhumi } from "@/enum/sebaranBmd";
import { BmdSyncStatus, BmdSubSyncStatus } from "@/enum/bmdSync";
import { BmdAssetType } from "@/enum/bmd";

export const sebaranBmdStatusBhumiEnum = pgEnum("sebaran_bmd_status_bhumi", StatusBhumi);
export const bmdSyncStatusEnum = pgEnum("bmd_sync_status", BmdSyncStatus);
export const bmdSubSyncStatusEnum = pgEnum("bmd_sub_sync_status", BmdSubSyncStatus);
export const bmdAssetTypeEnum = pgEnum("bmd_asset_type", BmdAssetType);