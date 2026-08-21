import Content from "./content";

type Props = {
    params: Promise<{ jobId: string; listId: string }>;
};

export default async function SyncListDetailPage({ params }: Props) {
    const { jobId, listId } = await params;
    return <Content jobId={Number(jobId)} listId={Number(listId)} />
}