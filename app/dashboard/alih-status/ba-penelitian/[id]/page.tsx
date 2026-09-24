import AlihStatusPermohonan from "./content";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const paramsData = await params;
    const id = parseInt(paramsData.id);
    if (isNaN(id)) throw new Error("ID tidak valid");
    return <AlihStatusPermohonan permohonanId={id} />;
}