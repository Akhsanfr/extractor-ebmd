import "server-only";
import { SuratPesananContract, SuratPesananExtractResult } from "./suratPesanan.contract";
import { OperationalError } from "@/action/actionResponse";

const PYTHON_EXTRACT_SERVICE_URL = process.env.PYTHON_EXTRACT_SERVICE_URL;
const PYTHON_EXTRACT_SERVICE_TIMEOUT_MS = 30_000;

class SuratPesananService {
  /**
   * Mengirim file PDF ke service Python untuk diekstrak, lalu memvalidasi
   * dan menormalkan hasilnya sebelum dikembalikan ke Action.
   */
  async extractFromPdf(file: File): Promise<SuratPesananExtractResult> {
    if (!PYTHON_EXTRACT_SERVICE_URL) {
      throw new OperationalError(
        "PYTHON_EXTRACT_SERVICE_URL belum dikonfigurasi"
      );
    }

    const upstreamFormData = new FormData();
    upstreamFormData.append("file", file, file.name);

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      PYTHON_EXTRACT_SERVICE_TIMEOUT_MS
    );

    let response: Response;
    try {
      response = await fetch(`${PYTHON_EXTRACT_SERVICE_URL}/document/extract`, {
        method: "POST",
        body: upstreamFormData,
        signal: controller.signal,
      });
    } catch (error) {
      throw new OperationalError(
        "Gagal menghubungi service ekstraksi PDF",
        error instanceof Error ? { cause: [error.message] } : undefined
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new OperationalError(
        `Service ekstraksi mengembalikan status ${response.status}`
      );
    }

    const rawResult = await response.json();

    // Struktur asli respons service Python: { metadata, raw, normalized, parsed }
    // Untuk kebutuhan UI, kita hanya mengambil bagian "parsed" + nama file dari "metadata".
    const parsed = rawResult?.parsed ?? rawResult;
    const filename = rawResult?.metadata?.filename;

    const validated = SuratPesananContract.extract.output.safeParse({
      filename,
      document_type: parsed?.document_type,
      confidence: parsed?.confidence,
      transaction_date: parsed?.transaction_date,
      items: parsed?.items ?? [],
    });

    if (!validated.success) {
      throw new OperationalError(
        "Hasil ekstraksi tidak sesuai format yang diharapkan",
        validated.error.flatten().fieldErrors
      );
    }

    return validated.data;
  }
}

export const suratPesananService = new SuratPesananService();
