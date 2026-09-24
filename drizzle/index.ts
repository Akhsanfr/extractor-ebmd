import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from "pg";
import { relations } from "./schema/relation"
import { alihStatusRelations } from './schema/alih-status/realation';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(process.env.DATABASE_URL!, {
    relations: { ...relations, ...alihStatusRelations }
});
