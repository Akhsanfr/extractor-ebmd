import { SuratPesananUploader } from "./upload";

export default function SuratPesananExtractPage() {
    return (
        <div className="container mx-auto flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-xl font-semibold">Ekstraksi Surat Pesanan</h1>
                <p className="text-sm text-default-500">
                    Upload dokumen PDF Surat Pesanan untuk diekstrak otomatis melalui
                    service AI.
                </p>
            </div>

            <SuratPesananUploader />
        </div>
    );
}