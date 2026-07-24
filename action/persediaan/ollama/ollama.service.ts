import { OllamaContract } from "./ollama.contract";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const EMBEDDING_MODEL = "bge-m3";
const TIMEOUT_MS = 60_000;
const EMBEDDING_DIM = 1024;

/**
 * Generate embedding untuk BANYAK input sekaligus dalam SATU request HTTP,
 * pakai endpoint /api/embed (bukan /api/embeddings yang legacy & single-only).
 * Ollama menjamin urutan output mengikuti urutan input.
 */
export async function generateEmbeddingBatch(
    inputs: OllamaContract.InputDTO[]
): Promise<number[][]> {
    if (inputs.length === 0) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const prompts = inputs.map(buildEmbeddingText);

    try {
        const res = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                input: prompts,
                keep_alive: -1, // model tetap warm di memori, hindari cold-start berulang
            }),
            signal: controller.signal,
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Ollama embed batch gagal (${res.status}): ${errText}`);
        }

        const data = (await res.json()) as { embeddings: number[][] };

        if (!data.embeddings || data.embeddings.length !== inputs.length) {
            throw new Error(
                `Jumlah embedding tidak sesuai jumlah input: dapat ${data.embeddings?.length ?? 0}, harus ${inputs.length}`
            );
        }

        data.embeddings.forEach((emb, i) => {
            if (!emb || emb.length !== EMBEDDING_DIM) {
                throw new Error(
                    `Dimensi embedding index ${i} tidak sesuai, dapat ${emb?.length ?? 0}, harus ${EMBEDDING_DIM}`
                );
            }
        });

        return data.embeddings;
    } catch (err: any) {
        if (err.name === "AbortError") {
            throw new Error(
                `Timeout: Ollama tidak merespon dalam ${TIMEOUT_MS / 1000} detik untuk batch ${inputs.length} item. Cek apakah Ollama service jalan (ollama ps) atau model masih loading.`
            );
        }
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

/** Wrapper single-item, dipakai di tempat yang cuma butuh 1 embedding (misal query pencarian tunggal). */
export async function generateEmbedding(input: OllamaContract.InputDTO): Promise<number[]> {
    const [embedding] = await generateEmbeddingBatch([input]);
    return embedding;
}

/**
 * Sumber teks embedding: kategori, namaBarang, dan Satuan
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