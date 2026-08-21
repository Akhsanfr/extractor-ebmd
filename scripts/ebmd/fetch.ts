/**
 * fetch-ebmd.ts
 *
 * Mengambil data eBMD secara bertingkat:
 *   Step 1: GET gettahunbarangnew   -> daftar { tahun }
 *   Step 2: GET getkodeitem         -> daftar { KodeItem, nama }  (per tahun)
 *   Step 3: GET getDataKib          -> array object data barang   (per kodeitem)
 *
 * Semua hasil step 3 dikumpulkan menjadi satu list, lalu diekspor ke file .xlsx
 *
 * Requirement:
 *   - Node.js 18+ (pakai fetch bawaan)
 *   - npm install xlsx
 *   - npm install -D typescript tsx @types/node   (untuk menjalankan .ts)
 *
 * Jalankan (pakai tsx, tanpa build manual):
 *   npx tsx fetch-ebmd.ts
 *
 * atau compile dulu baru jalankan:
 *   npx tsc fetch-ebmd.ts && node fetch-ebmd.js
 *
 * Catatan tsconfig: pastikan "module": "esnext" atau "nodenext" supaya
 * `import xlsx from "xlsx"` bekerja.
 */

import xlsx from "xlsx";
import "dotenv/config"; // npm install dotenv

// Session cookie dari eBMD (ambil dari DevTools/Postman setelah login manual).
// JANGAN hardcode di source code — taruh di file .env (dan .env masuk .gitignore):
//   EBMD_SESSION_COOKIE=ebmdpasuruan_session=xxxxxxxx...
const SESSION_COOKIE = process.env.EBMD_SESSION_COOKIE;

if (!SESSION_COOKIE) {
    console.warn(
        "[WARN] EBMD_SESSION_COOKIE tidak diset di .env — request kemungkinan akan gagal (404) karena butuh login."
    );
}

// ==================== TYPES ====================

interface TahunItem {
    tahun: number;
}

interface KodeItemItem {
    KodeItem: string;
    nama: string;
}

// Struktur baris hasil getDataKib tidak diketahui pasti (bebas/dinamis dari API),
// jadi digunakan index signature.
type DataKibRow = Record<string, unknown>;

interface HasilRow extends DataKibRow {
    tahun: number;
    kodeItem: string;
    namaKodeItem: string;
}

// ==================== KONFIGURASI ====================

const BASE_URL = "https://ebmd.pasuruankab.go.id/service";
const ORGANISASI_ID = 12;
const KODELOK = "07.00.00";
const JENIS_KIB = 1;

const OUTPUT_FILE = "hasil-ebmd.xlsx";

// Jeda antar request (ms) supaya tidak membebani server. Set 0 kalau tidak perlu.
const DELAY_MS = 150;

// Retry sederhana kalau request gagal
const MAX_RETRY = 3;
const RETRY_DELAY_MS = 1000;

// ==================== HELPER ====================

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch JSON dengan retry.
 */
// Header standar browser. Beberapa server pemda menolak/404-kan request
// yang tidak punya User-Agent atau Referer (dianggap bukan dari halaman web-nya).
const COMMON_HEADERS: Record<string, string> = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
    Accept: "application/json, text/javascript, */*; q=0.01",
    Referer: "https://ebmd.pasuruankab.go.id/aset/koreksi/asetkoreksi/tambah2",
    "X-Requested-With": "XMLHttpRequest",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    ...(SESSION_COOKIE ? { Cookie: SESSION_COOKIE } : {}),
};

async function fetchJson<T>(url: string): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
        try {
            const res = await fetch(url, { headers: COMMON_HEADERS });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status} ${res.statusText}`);
            }
            const data = (await res.json()) as T;
            return data;
        } catch (err) {
            lastErr = err;
            const message = err instanceof Error ? err.message : String(err);
            console.warn(
                `  [WARN] Gagal fetch (percobaan ${attempt}/${MAX_RETRY}): ${url}\n         ${message}`
            );
            if (attempt < MAX_RETRY) {
                await sleep(RETRY_DELAY_MS);
            }
        }
    }
    throw lastErr;
}

// ==================== STEP FUNCTIONS ====================

// Step 1: ambil daftar tahun
async function getTahunList(): Promise<TahunItem[]> {
    const url = `${BASE_URL}/gettahunbarangnew?OrganisasiId=${ORGANISASI_ID}&&kodelok=${KODELOK}&&JenisKib=${JENIS_KIB}`;
    const data = await fetchJson<TahunItem[]>(url);
    return Array.isArray(data) ? data : [];
}

// Step 2: ambil daftar kodeitem untuk 1 tahun
async function getKodeItemList(tahun: number): Promise<KodeItemItem[]> {
    const url = `${BASE_URL}/getkodeitem?OrganisasiId=${ORGANISASI_ID}&&tahun=${tahun}&&kodelok=${KODELOK}&&JenisKib=${JENIS_KIB}`;
    const data = await fetchJson<KodeItemItem[]>(url);
    return Array.isArray(data) ? data : [];
}

// Step 3: ambil data kib untuk 1 kodeitem (di 1 tahun)
async function getDataKib(tahun: number, kodeitem: string): Promise<DataKibRow[]> {
    const url = `${BASE_URL}/getDataKib?OrganisasiId=${ORGANISASI_ID}&&tahun=${tahun}&&JenisKib=${JENIS_KIB}&&kodelok=${KODELOK}&&kodeitem=${encodeURIComponent(
        kodeitem
    )}`;
    const data = await fetchJson<DataKibRow[]>(url);
    return Array.isArray(data) ? data : [];
}

// ==================== MAIN ====================

async function main(): Promise<void> {
    console.log("=== Mulai proses fetch berjenjang ===");
    const hasilAkhir: HasilRow[] = [];

    // STEP 1
    console.log("[Step 1] Mengambil daftar tahun...");
    const tahunList = await getTahunList();
    console.log(`  -> Ditemukan ${tahunList.length} tahun`);

    for (const { tahun } of tahunList) {
        console.log(`\n[Step 2] Tahun ${tahun}: mengambil daftar kodeitem...`);
        await sleep(DELAY_MS);

        let kodeItemList: KodeItemItem[] = [];
        try {
            kodeItemList = await getKodeItemList(tahun);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`  [ERROR] Gagal ambil kodeitem untuk tahun ${tahun}: ${message}`);
            continue;
        }
        console.log(`  -> Ditemukan ${kodeItemList.length} kodeitem`);

        for (const { KodeItem, nama } of kodeItemList) {
            console.log(`  [Step 3] Tahun ${tahun} | ${KodeItem} - ${nama}`);
            await sleep(DELAY_MS);

            let dataKib: DataKibRow[] = [];
            try {
                dataKib = await getDataKib(tahun, KodeItem);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(
                    `    [ERROR] Gagal ambil data kib (tahun=${tahun}, kodeitem=${KodeItem}): ${message}`
                );
                continue;
            }

            if (dataKib.length === 0) {
                console.log(`    -> Tidak ada data`);
                continue;
            }

            console.log(`    -> ${dataKib.length} baris data`);

            // Tambahkan context (tahun, kodeitem, nama) ke tiap object hasil,
            // supaya jelas asal datanya waktu dilihat di Excel.
            for (const row of dataKib) {
                hasilAkhir.push({
                    tahun,
                    kodeItem: KodeItem,
                    namaKodeItem: nama,
                    ...row,
                });
            }
        }
    }

    console.log(`\n=== Total data terkumpul: ${hasilAkhir.length} baris ===`);

    if (hasilAkhir.length === 0) {
        console.log("Tidak ada data untuk disimpan. Selesai tanpa membuat file xlsx.");
        return;
    }

    // ==================== EXPORT KE XLSX ====================
    const worksheet = xlsx.utils.json_to_sheet(hasilAkhir);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Hasil");

    xlsx.writeFile(workbook, OUTPUT_FILE);
    console.log(`Berhasil disimpan ke: ${OUTPUT_FILE}`);
}

main().catch((err) => {
    console.error("Terjadi kesalahan fatal:", err);
    process.exit(1);
});