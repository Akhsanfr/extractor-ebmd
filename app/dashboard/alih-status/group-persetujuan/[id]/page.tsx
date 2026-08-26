import Content from "./content";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const paramsData = await params;
    const id = parseInt(paramsData.id);
    if (isNaN(id)) throw new Error("ID tidak valid");
    return <Content groupId={id} />;
}