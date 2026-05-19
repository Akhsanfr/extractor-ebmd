import { BarangTableLoader } from "@/component/barangTableLoader";

export default function LaporanPage() {
    return (
        <div className="p-6">
            <h1 className="text-lg font-semibold mb-4">Laporan BMD</h1>
            <BarangTableLoader />
        </div>
    );
}