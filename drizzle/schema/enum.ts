import { pgEnum } from "drizzle-orm/pg-core";
import { StatusBhumi } from "@/enum/sebaranBmd";
import { EmbeddingStatus } from "@/enum/embedding";
import { UserRole } from "@/enum/user";

export const sebaranBmdStatusBhumiEnum = pgEnum("sebaran_bmd_status_bhumi", StatusBhumi);
export const embeddingStatusEnum = pgEnum("embedding_status", EmbeddingStatus);
export const userRoleEnum = pgEnum("user_role_enum", UserRole);