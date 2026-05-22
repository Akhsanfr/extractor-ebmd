import { AsetType, BarangAll, BarangMerged, ALL_ASET_TYPES } from "@/types/bmd";

const STORAGE_KEY = (asetType: AsetType) => `bmd_merged_${asetType}`;


export const PENGADAAN_STORAGE_KEY_V1 = 'bmd_list_pengadaan'
export const PENGADAAN_STORAGE_KEY = 'bmd_list_pengadaan_v2'
export const PERANGKAT_DAERAH_KEY = 'perangkat_daerah_key'

export function loadFromStorage(asetType: AsetType): BarangMerged[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY(asetType));
        return raw ? (JSON.parse(raw) as BarangMerged[]) : [];
    } catch {
        return [];
    }
}

export function loadAllFromStorage(): BarangAll[] {
    const all: BarangAll[] = [];
    for (const asetType of ALL_ASET_TYPES) {
        const items = loadFromStorage(asetType);
        for (const item of items) {
            all.push({ ...item, asetType });
        }
    }
    return all.map((item, idx) => ({ ...item, nomor: idx + 1 }));
}

export function loadStorage<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}
export function saveStorage<T>(key: string, data: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error("Gagal menyimpan ke localStorage", error);
    }
}