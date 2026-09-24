import "dotenv/config";
import { Client } from "pg";
import * as XLSX from "xlsx";

const availableTableNames: readonly string[] = [];

const VECTOR_STRING_THRESHOLD = 200; // chars
const VECTOR_ARRAY_THRESHOLD = 20; // elements

const getAllTableNames = async (
    client: Client,
): Promise<string[]> => {
    const result = await client.query<{
        table_name: string;
    }>(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_type = 'BASE TABLE'
         ORDER BY table_name`,
    );

    return result.rows.map(
        (row) => row.table_name,
    );
};

const sanitizeSheetName = (
    nameTable: string,
    usedNames: Set<string>,
): string => {
    // Excel sheet names: max 31 chars, no : \ / ? * [ ]
    let name = nameTable
        .replace(/[:\\/?*[\]]/g, "_")
        .slice(0, 31);

    if (!usedNames.has(name)) {
        usedNames.add(name);
        return name;
    }

    let suffix = 1;
    let candidate = name;

    while (usedNames.has(candidate)) {
        const suffixStr = `_${suffix}`;
        candidate =
            name.slice(
                0,
                31 - suffixStr.length,
            ) + suffixStr;
        suffix += 1;
    }

    usedNames.add(candidate);
    return candidate;
};

// Replaces embedding/vector-like values (huge arrays or huge
// "[0.1,0.2,...]" strings) with a short placeholder so xlsx
// doesn't choke building/writing giant cells.
const sanitizeRow = (
    row: Record<string, unknown>,
): Record<string, unknown> => {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
        if (Array.isArray(value)) {
            sanitized[key] =
                value.length > VECTOR_ARRAY_THRESHOLD
                    ? `[vector: ${value.length} dims]`
                    : value.join(", ");
            continue;
        }

        if (
            typeof value === "string" &&
            value.length > VECTOR_STRING_THRESHOLD &&
            value.startsWith("[") &&
            value.endsWith("]")
        ) {
            const approxDims = (
                value.match(/,/g) ?? []
            ).length + 1;
            sanitized[key] = `[vector: ~${approxDims} dims]`;
            continue;
        }

        sanitized[key] = value;
    }

    return sanitized;
};

const addTableSheet = async (
    client: Client,
    workbook: XLSX.WorkBook,
    nameTable: string,
    usedNames: Set<string>,
): Promise<void> => {
    console.log(
        `  → querying "${nameTable}"...`,
    );

    const result = await client.query(
        `SELECT * FROM "${nameTable}"`,
    );

    console.log(
        `  → got ${result.rows.length} rows, building sheet...`,
    );

    if (result.rows.length === 0) {
        console.log(
            `Table "${nameTable}" kosong, dilewati.`,
        );
        return;
    }

    const sanitizedRows = result.rows.map(
        (row: Record<string, unknown>) =>
            sanitizeRow(row),
    );

    const worksheet = XLSX.utils.json_to_sheet(
        sanitizedRows,
    );

    const sheetName = sanitizeSheetName(
        nameTable,
        usedNames,
    );

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        sheetName,
    );

    console.log(
        `✓ ${nameTable}: ${result.rows.length} rows`,
    );
};

const main = async (): Promise<void> => {
    const client = new Client({
        connectionString:
            process.env.DATABASE_URL,
    });

    try {
        await client.connect();

        const tableNames = await getAllTableNames(
            client,
        );

        if (tableNames.length === 0) {
            console.log(
                "Tidak ada table ditemukan di schema 'public'.",
            );
            return;
        }

        console.log(
            `Ditemukan ${tableNames.length} table:\n${tableNames
                .map((table) => `  - ${table}`)
                .join("\n")}\n`,
        );

        const workbook = XLSX.utils.book_new();
        const usedNames = new Set<string>();

        for (const nameTable of tableNames) {
            console.log(
                `Exporting "${nameTable}"...`,
            );

            await addTableSheet(
                client,
                workbook,
                nameTable,
                usedNames,
            );
        }

        if (workbook.SheetNames.length === 0) {
            console.log(
                "\nSemua table kosong, tidak ada file yang dibuat.",
            );
            return;
        }

        const outputFile = "all_tables.xlsx";

        console.log(
            `\nMenulis workbook ke "${outputFile}"...`,
        );

        XLSX.writeFile(workbook, outputFile);

        console.log(
            `Selesai. ${workbook.SheetNames.length} sheet ditulis ke "${outputFile}".`,
        );
    } finally {
        await client.end();
    }
};

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});