"use client";

import { useEffect, useState } from "react";
import {
    Copy,
    Check,
    WandSparkles,
    RefreshCw,
} from "lucide-react";
import { Button, Card, Input } from "@heroui/react";

type PerangkatDaerah = {
    ID: string;
    LOKASI: string;
    STATUS: string;
    "PARENT ID": string;
};

type Program = {
    PROGRAM: string;
    KEGIATAN: string;
};

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateDummy(
    perangkatDaerah: PerangkatDaerah[],
    programs: Program[],
    count: number
) {
    const penggunaBarangList = perangkatDaerah.filter(
        (x) => x.STATUS === "Pengguna Barang"
    );

    const kuasaPenggunaBarangList = perangkatDaerah.filter(
        (x) => x.STATUS === "Kuasa Pengguna Barang"
    );

    return Array.from({ length: count }, (_, index) => {
        const penggunaBarang = randomItem(
            penggunaBarangList
        );

        const kuasaCandidates =
            kuasaPenggunaBarangList.filter(
                (x) =>
                    x["PARENT ID"] ===
                    penggunaBarang.ID
            );

        const kuasaPenggunaBarang =
            kuasaCandidates.length > 0
                ? randomItem(kuasaCandidates)
                : randomItem(
                    kuasaPenggunaBarangList
                );

        const program = randomItem(programs);

        const jumlah =
            Math.floor(Math.random() * 10) + 1;

        return {
            id: index + 1,
            penggunaBarang:
                penggunaBarang.LOKASI,
            kuasaPenggunaBarang:
                kuasaPenggunaBarang.LOKASI,
            program: program.PROGRAM,
            kegiatan: program.KEGIATAN,
            output:
                "Terlaksananya kegiatan",

            usulan: {
                kodeBarang:
                    "1.3.1.01.01.01.001",
                namaBarang:
                    "Tanah Bangunan Rumah Negara Golongan I",
                satuan: "Unit",
                asetType:
                    "peralatan_mesin",
                jumlah,
            },

            bmdBisaDioptimalkan: {
                kodeBarang:
                    "1.3.1.01.01.01.001",
                namaBarang:
                    "Tanah Bangunan Rumah Negara Golongan I",
                satuan: "Unit",
                asetType:
                    "peralatan_mesin",
                jumlah: 0,
            },

            kebutuhanRiil: {
                jumlah,
                satuan: "Unit",
            },
        };
    });
}

export default function Page() {
    const [jumlah, setJumlah] =
        useState("100");

    const [hasil, setHasil] =
        useState("");

    const [copied, setCopied] =
        useState(false);

    const [loadingData, setLoadingData] =
        useState(true);

    const [
        perangkatDaerah,
        setPerangkatDaerah,
    ] = useState<PerangkatDaerah[]>([]);

    const [programs, setPrograms] =
        useState<Program[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const [
                    perangkatDaerahRes,
                    programRes,
                ] = await Promise.all([
                    fetch(
                        "/data/perangkatDaerah.json"
                    ),
                    fetch("/data/program.json"),
                ]);

                const [
                    perangkatDaerahData,
                    programData,
                ] = await Promise.all([
                    perangkatDaerahRes.json(),
                    programRes.json(),
                ]);

                setPerangkatDaerah(
                    perangkatDaerahData
                );

                setPrograms(programData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingData(false);
            }
        }

        loadData();
    }, []);

    const handleGenerate = async () => {
        const count =
            Number(jumlah) || 0;

        if (count <= 0) {
            return;
        }

        const result =
            generateDummy(
                perangkatDaerah,
                programs,
                count
            );

        await navigator.clipboard.writeText(
            JSON.stringify(result)
        );
        // setHasil(
        //     JSON.stringify(
        //         result,
        //         null,
        //         2
        //     )
        // );
    };

    const handleCopy = async () => {
        if (!hasil) return;

        await navigator.clipboard.writeText(
            hasil
        );

        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    return (
        <div className="container mx-auto max-w-7xl p-6 space-y-6">
            <Card>
                <Card.Header>
                    <div>
                        <h1 className="text-2xl font-bold">
                            Generator Dummy
                            RKBMD
                        </h1>

                        <p className="text-sm text-default-500">
                            Generate data
                            dummy berdasarkan
                            perangkat daerah
                            dan program.
                        </p>
                    </div>
                </Card.Header>

                <Card.Content>
                    <div className="flex flex-col md:flex-row gap-4">
                        <Input
                            type="number"
                            min={1}
                            value={jumlah}
                            onChange={(e) => setJumlah(e.target.value)}
                            className="max-w-xs"
                        />

                        <Button
                            onPress={
                                handleGenerate
                            }
                            isDisabled={
                                loadingData
                            }
                        >
                            <WandSparkles
                                size={18}
                            />
                            Generate
                        </Button>

                        <Button
                            onPress={() =>
                                window.location.reload()
                            }
                        >
                            <RefreshCw
                                size={18}
                            />
                            Reload Data
                        </Button>
                    </div>
                </Card.Content>
            </Card>

            <Card>
                <Card.Header className="flex justify-between items-center">
                    <h2 className="font-semibold">
                        Hasil JSON
                    </h2>

                    <Button
                        isIconOnly
                        onPress={handleCopy}
                        isDisabled={!hasil}
                    >
                        {copied ? (
                            <Check
                                size={18}
                            />
                        ) : (
                            <Copy
                                size={18}
                            />
                        )}
                    </Button>
                </Card.Header>

                <Card.Content>
                    <pre className="bg-default-100 rounded-lg p-4 overflow-auto max-h-[70vh] text-sm">
                        <code>
                            {hasil ||
                                "// Klik Generate untuk membuat data"}
                        </code>
                    </pre>
                </Card.Content>
            </Card>
        </div>
    );
}