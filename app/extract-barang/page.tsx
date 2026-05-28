"use client"

import { actionExtractDaftarBarang } from "@/action/extractorDaftarBarang"
import { useState } from "react"
export default function Page() {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<any[] | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSyncData = async () => {
        setIsLoading(true)
        setError(null)
        setResult(null)

        try {
            // Memanggil Server Action langsung dari fungsi onClick
            const res = await actionExtractDaftarBarang('01.00.00', 'DINAS PENDIDIKAN')

            if (res.success && res.data) {
                setResult(res.data)
                console.info("Data Mentah")
                console.table(res.rawData)
                console.info("Data Final")
                console.table(res.data)
            } else {
                setError(res.error || "Terjadi kesalahan yang tidak diketahui")
            }
        } catch (err) {
            setError("Gagal menghubungi server action.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">
                Sinkronisasi Aset Tanah (KIB A)
            </h1>

            <p className="text-gray-600 mb-6">
                Klik tombol di bawah untuk menarik data dari portal E-BMD Pasuruan, mengubah Excel menjadi JSON, dan menampilkannya.
            </p>

            <button
                onClick={handleSyncData}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md disabled:bg-blue-300 transition-colors"
            >
                {isLoading ? "Memproses Data..." : "Tarik Data Excel"}
            </button>

            {/* Tampilan Error */}
            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Tampilan Hasil (Preview JSON) */}
            {result && (
                <div className="mt-6">
                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-4">
                        Berhasil mengekstrak <strong>{result.length}</strong> baris data!
                    </div>

                    <h3 className="font-semibold text-gray-700 mb-2">Pratinjau Data (3 Baris Pertama):</h3>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm">
                        {JSON.stringify(result.slice(0, 3), null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}