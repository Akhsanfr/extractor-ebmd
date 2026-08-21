import { pollEbmdBatchWorker, runEbmdListWorkerOnce } from "@/action/sync/worker/ebmd/ebmdSync.runner.example";


async function main() {
    console.log("EBMD Worker started...");

    // polling list tiap 30 detik
    setInterval(async () => {
        try {
            await runEbmdListWorkerOnce();
        } catch (e) {
            console.error("List Worker Error:", e);
        }
    }, 30_000);

    // batch worker jalan terus
    await pollEbmdBatchWorker(1000);
}

main().catch(console.error);