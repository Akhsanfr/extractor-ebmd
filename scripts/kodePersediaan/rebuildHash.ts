import { KodePersediaanService } from "@/action/persediaan/kodePersediaan/kodePersediaan.service";
KodePersediaanService.rebuildHash()
    .then((result) => {
        console.log("✅ Done:", result);
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Backfill gagal:", err);
        process.exit(1);
    });