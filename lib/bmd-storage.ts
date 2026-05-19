import { AsetType, BarangAll, BarangMerged, ALL_ASET_TYPES } from "@/types/bmd";

const STORAGE_KEY = (asetType: AsetType) => `bmd_merged_${asetType}`;

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