import { backfillMissingEmbeddingRows } from "@/action/persediaan/kodePersediaanEmbedding/embedding.service";

backfillMissingEmbeddingRows()
    .then((result) => {
        console.log("✅ Done:", result);
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Backfill gagal:", err);
        process.exit(1);
    });