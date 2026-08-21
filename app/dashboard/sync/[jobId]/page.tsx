import Content from "./content";

type Props = {
    params: Promise<{ jobId: string }>;
};

export default async function SyncJobDetailPage({ params }: Props) {
    const jobId = (await params).jobId;
    return <Content jobId={Number(jobId)} />
}