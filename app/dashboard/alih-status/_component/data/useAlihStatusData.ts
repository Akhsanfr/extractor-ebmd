"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actionImportAlihStatusData } from "@/action/alih-status/data/action.create";
import { actionDeleteAlihStatusData } from "@/action/alih-status/data/action.delete";
import { actionGetListAlihStatusData, actionGetListAlihStatusDataByMasterId } from "@/action/alih-status/data/action.read";
import { AlihStatusDataContract } from "@/action/alih-status/data/contract";

function unwrapAction<T>(result: { success: boolean; data?: T; error?: unknown }): T {
    if (!result.success) {
        throw result.error instanceof Error ? result.error : new Error("Terjadi kesalahan");
    }
    return result.data as T;
}

export function useAlihStatusDataQuery(query: AlihStatusDataContract.QueryDTO) {
    return useQuery({
        queryKey: ["alih-status-data"],
        queryFn: async () => unwrapAction(await actionGetListAlihStatusData(query)),
    });
}

export function useDeleteAlihStatusData(masterId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => actionDeleteAlihStatusData({ id }),
        onSuccess: (result) => {
            unwrapAction(result);
            queryClient.invalidateQueries({ queryKey: ["alih-status-data"] });
        },
    });
}

export function useImportAlihStatusData(permohonanId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => actionImportAlihStatusData({ data: file, permohonanId }),
        onSuccess: (result) => {
            unwrapAction(result);
            queryClient.invalidateQueries({ queryKey: ["alih-status-data"] });
        },
    });
}