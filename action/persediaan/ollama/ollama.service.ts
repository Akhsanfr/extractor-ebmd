import { OllamaContract } from "./ollama.contract";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const EMBEDDING_MODEL = "bge-m3";
const TIMEOUT_MS = 60_000;

export async function generateEmbedding(input: OllamaContract.InputDTO): Promise<OllamaContract.ResultDTO> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const prompt = buildEmbeddingText(input);
    try {
        const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: EMBEDDING_MODEL, prompt }),
            signal: controller.signal,
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Ollama embedding gagal (${res.status}): ${errText}`);
        }

        const data = (await res.json()) as { embedding: number[] };

        if (!data.embedding || data.embedding.length !== 1024) {
            throw new Error(
                `Dimensi embedding tidak sesuai, dapat ${data.embedding?.length ?? 0}, harus 1024`
            );
        }

        return data.embedding;
    } catch (err: any) {
        if (err.name === "AbortError") {
            throw new Error(
                `Timeout: Ollama tidak merespon dalam ${TIMEOUT_MS / 1000} detik. Cek apakah Ollama service jalan (ollama ps) atau model masih loading.`
            );
        }
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Sumber teks embedding nama108, namaBarang, dan Satuan
 */
export function buildEmbeddingText(input: OllamaContract.InputDTO): string {
    const parts: string[] = [];

    if (input.kategori) {
        parts.push(`Kategori: ${input.kategori}`);
    }

    parts.push(`Barang: ${input.namaBarang}`);

    if (input.satuan) {
        parts.push(`Satuan: ${input.satuan}`);
    }

    if (input.keywords) {
        parts.push(`Sinonim: ${input.keywords}`);
    }

    return parts.join(". ");
}