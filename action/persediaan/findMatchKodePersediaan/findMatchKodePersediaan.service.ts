import { generateEmbeddingBatch } from "../ollama/ollama.service";
import { FindMatchKodePersediaanContract } from "./findMatchKodePersediaan.contract";
import { FindMatchKodePersediaanRepository } from "./findMatchKodePersediaan.repository";

const DEFAULT_CANDIDATE_LIMIT = 5;
/** Similarity minimum agar kandidat layak ditampilkan ke user. */
const MIN_SIMILARITY_THRESHOLD = 0.1;
/** Ambil lebih banyak kandidat dari DB sebelum difilter threshold, supaya LIMIT tidak memotong kandidat valid. */
const FETCH_MULTIPLIER = 4;

export const FindMatchKodePersediaanService = {
    async matchItems(
        items: FindMatchKodePersediaanContract.InputDTO
    ): Promise<FindMatchKodePersediaanContract.OutputDTO> {
        // 1 request batch untuk semua item, bukan N request paralel.
        // PENTING: pastikan mapping field di bawah cocok dengan bentuk asli `item`
        // (mis. kalau field satuan di DTO namanya `unit`, map eksplisit ke `satuan`
        // di sini — jangan andalkan nama field otomatis sama, ini sumber bug diam-diam
        // yang bikin teks embedding query beda struktur dari teks embedding korpus).
        const embeddings = await generateEmbeddingBatch(
            items.map((item) => ({
                kategori: item.kategori,
                namaBarang: item.namaBarang,
                satuan: item.unit,
                keywords: item.keywords,
            }))
        );

        return Promise.all(
            items.map(async (item, i) => {
                const rows = await FindMatchKodePersediaanRepository.findSimilarByEmbedding(
                    embeddings[i],
                    DEFAULT_CANDIDATE_LIMIT * FETCH_MULTIPLIER
                );

                const candidates = rows
                    .filter((candidate) => candidate.similarity >= MIN_SIMILARITY_THRESHOLD)
                    .sort((a, b) => b.similarity - a.similarity)
                    .slice(0, DEFAULT_CANDIDATE_LIMIT);

                return {
                    description: item.namaBarang,
                    unit: item.unit,
                    price: item.price,
                    candidates,
                };
            })
        );
    },
};