import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import * as schema from "@/drizzle/schema";

type PostgresJsTx = PgTransaction<
    PostgresJsQueryResultHKT,
    typeof schema,
    ExtractTablesWithRelations<typeof schema>
>;

export type DbOrTx =
    | PostgresJsDatabase<typeof schema>  // query biasa & transaksi
    | PostgresJsTx;                      // dalam transaksi