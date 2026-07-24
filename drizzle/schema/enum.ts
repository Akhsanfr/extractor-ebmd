import { pgEnum } from "drizzle-orm/pg-core";
import { StatusBhumi } from "@/enum/sebaranBmd";
import { EmbeddingStatus } from "@/enum/embedding";

export const sebaranBmdStatusBhumiEnum = pgEnum("sebaran_bmd_status_bhumi", StatusBhumi);
export const embeddingStatusEnum = pgEnum("embedding_status", EmbeddingStatus);