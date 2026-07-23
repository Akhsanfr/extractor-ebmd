import { startEmbeddingWorker } from "@/action/persediaan/kodePersediaanEmbedding/embedding.service";

startEmbeddingWorker().catch((err) => {
    console.error("Fatal worker error:", err);
    process.exit(1);
});