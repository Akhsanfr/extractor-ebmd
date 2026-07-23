import { generateEmbedding } from "../ollama/ollama.service";
import { FindMatchKodePersediaanContract } from "./findMatchKodePersediaan.contract";
import { FindMatchKodePersediaanRepository } from "./findMatchKodePersediaan.repository";

const DEFAULT_CANDIDATE_LIMIT = 5;
/** Similarity minimum agar kandidat layak ditampilkan ke user. */
const MIN_SIMILARITY_THRESHOLD = 0.1;

export const FindMatchKodePersediaanService = {
    async matchItems(
        items: FindMatchKodePersediaanContract.InputDTO
    ): Promise<FindMatchKodePersediaanContract.OutputDTO> {
        return Promise.all(
            items.map(async (item) => {
                const embedding = await generateEmbedding(item);

                const rows = await FindMatchKodePersediaanRepository.findSimilarByEmbedding(
                    embedding,
                    DEFAULT_CANDIDATE_LIMIT
                );

                const candidates = rows
                    .filter((candidate) => candidate.similarity >= MIN_SIMILARITY_THRESHOLD)
                    .sort((a, b) => b.similarity - a.similarity);
                return {
                    description: item.namaBarang,
                    unit: item.unit,
                    price: item.price,
                    candidates,
                };
            })
        );
    }
}