import { AlihStatusDataContract } from "@/action/alih-status/data/contract";
import { AlihStatusTabelData } from "./data/tableData";
import Loading from "@/component/loading";
import { Label } from "@heroui/react";

export default function DetailData({ data, isLoading }: { data: AlihStatusDataContract.SelectDTO[], isLoading: boolean }) {
    return <>
        <Label>Data Barang Milik Daerah</Label>
        {isLoading ? <Loading /> :
            <AlihStatusTabelData data={data} />
        }
    </>
}