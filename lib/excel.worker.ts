// lib/excel.worker.ts
import ExcelJS from "exceljs";

// Helper membuat baris yang presisi
const createRow = (
    colB: any = "", colC: any = "", colD: any = "", colE: any = "", colF: any = "",
    colG: any = "", colH: any = "", colI: any = "", colJ: any = "", colK: any = "",
    colL: any = "", colM: any = "", colN: any = ""
) => {
    const row: any[] = [];
    row[1] = "";
    row[2] = colB; row[3] = colC; row[4] = colD; row[5] = colE; row[6] = colF;
    row[7] = colG; row[8] = colH; row[9] = colI; row[10] = colJ; row[11] = colK;
    row[12] = colL; row[13] = colM; row[14] = colN;
    return row;
};

self.addEventListener("message", async (event) => {
    const { data, templateBuffer } = event.data;

    try {
        // 1. KELOMPOKKAN DATA
        const grouped: Record<string, any> = {};
        data.forEach((item: any) => {
            const { kuasaPenggunaBarang, program, kegiatan, output } = item;
            if (!grouped[kuasaPenggunaBarang]) grouped[kuasaPenggunaBarang] = {};
            if (!grouped[kuasaPenggunaBarang][program]) grouped[kuasaPenggunaBarang][program] = {};
            if (!grouped[kuasaPenggunaBarang][program][kegiatan]) grouped[kuasaPenggunaBarang][program][kegiatan] = {};
            if (!grouped[kuasaPenggunaBarang][program][kegiatan][output]) grouped[kuasaPenggunaBarang][program][kegiatan][output] = [];
            grouped[kuasaPenggunaBarang][program][kegiatan][output].push(item);
        });

        // 2. SUSUN BARIS DATA
        const exportRows: any[][] = [];
        const getAlpha = (i: number) => String.fromCharCode(65 + i);
        const getLowerAlpha = (i: number) => String.fromCharCode(97 + i);

        let kuasaIndex = 1;
        for (const [kuasa, programs] of Object.entries(grouped)) {
            exportRows.push(createRow(`${kuasaIndex}. ${kuasa}`));
            let progIndex = 0;
            for (const [program, kegiatans] of Object.entries(programs as Record<string, any>)) {
                exportRows.push(createRow(`     ${getAlpha(progIndex)}. ${program}`));
                let kegIndex = 1;
                for (const [kegiatan, outputs] of Object.entries(kegiatans as Record<string, any>)) {
                    exportRows.push(createRow(`          ${kegIndex}). ${kegiatan}`));
                    let outIndex = 0;
                    for (const [output, items] of Object.entries(outputs as Record<string, any>)) {
                        exportRows.push(createRow(`               ${getLowerAlpha(outIndex)}. ${output}`));
                        for (const item of items as any) {
                            exportRows.push(createRow(
                                "", item.kodeBarang, item.namaBarang, item.jumlahTersedia, item.satuan,
                                "Milik Sendiri", "v", "", "", item.namaPemeliharaan, item.jumlah, item.satuan, ""
                            ));
                        }
                        outIndex++;
                    }
                    kegIndex++;
                }
                progIndex++;
            }
            kuasaIndex++;
        }

        // 3. LOAD TEMPLATE & PROSES EXCELJS
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(templateBuffer); // Membaca buffer dari Main Thread
        const ws = workbook.getWorksheet("PEMELIHARAAN") || workbook.worksheets[0];

        // 4. SISIPKAN DATA
        const START_ROW = 13;
        ws.insertRows(START_ROW, exportRows);

        // 5. BUAT BORDER LEBIH EFISIEN
        const thinBorder: Partial<ExcelJS.Borders> = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
        };

        exportRows.forEach((_, index) => {
            const row = ws.getRow(START_ROW + index);
            for (let col = 1; col <= 14; col++) {
                row.getCell(col).border = thinBorder;
            }
        });

        // 6. GENERATE BUFFER
        const outBuffer = await workbook.xlsx.writeBuffer();

        // Kirim hasil kembali ke Main Thread
        self.postMessage({ type: "SUCCESS", buffer: outBuffer });
    } catch (error: any) {
        self.postMessage({ type: "ERROR", error: error.message });
    }
});