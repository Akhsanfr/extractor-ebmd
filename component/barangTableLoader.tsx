"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/react";
import { BarangAll } from "@/types/bmd";
import { loadAllFromStorage } from "@/lib/bmd-storage";
import { BarangTable } from "./barangTable";

export function BarangTableLoader() {
    const [data, setData] = useState<BarangAll[]>([]);

    const reload = useCallback(() => {
        setData(loadAllFromStorage());
    }, []);

    useEffect(() => {
        reload();
        window.addEventListener("focus", reload);
        return () => window.removeEventListener("focus", reload);
    }, [reload]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-default-500">
                    Total <span className="font-semibold text-default-800">{data.length}</span> barang dari semua kategori
                </p>
                <Button size="sm" onPress={reload}>
                    Refresh
                </Button>
            </div>
            <BarangTable data={data} mode="view" />
        </div>
    );
}