import { pgEnum } from "drizzle-orm/pg-core";
import { StatusBhumi } from "@/enum/sebaranBmd";

export const sebaranBmdStatusBhumiEnum = pgEnum("sebaran_bmd_status_bhumi", StatusBhumi);