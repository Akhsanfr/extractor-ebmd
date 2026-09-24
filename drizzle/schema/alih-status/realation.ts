import { defineRelations } from "drizzle-orm";
import * as schema from "./index";
export const alihStatusRelations = defineRelations(schema, (r) => ({
    alihStatusPermohonanTable: {
        data: r.many.alihStatusDataTable(),
    },

    alihStatusSpkmbTable: {
        data: r.many.alihStatusDataTable(),
    },

    alihStatusBAPenelitianTable: {
        data: r.many.alihStatusDataTable(),
    },

    alihStatusNodinTable: {
        data: r.many.alihStatusDataTable(),
    },

    alihStatusPersetujuanBupatiTable: {
        data: r.many.alihStatusDataTable(),
    },

    alihStatusBASTTable: {
        data: r.many.alihStatusDataTable(),
    },

    alihStatusPermohonanPenghapusanTable: {
        data: r.many.alihStatusDataTable(),
    },

    alihStatusSKHapusTable: {
        data: r.many.alihStatusDataTable(),
    },

    alihStatusDataTable: {
        spkmb: r.one.alihStatusSpkmbTable({
            from: r.alihStatusDataTable.spkmbId,
            to: r.alihStatusSpkmbTable.id,
        }),

        permohonan: r.one.alihStatusPermohonanTable({
            from: r.alihStatusDataTable.permohonanId,
            to: r.alihStatusPermohonanTable.id,
        }),

        BAPenelitian: r.one.alihStatusBAPenelitianTable({
            from: r.alihStatusDataTable.BAPenelitianId,
            to: r.alihStatusBAPenelitianTable.id,
        }),

        nodin: r.one.alihStatusNodinTable({
            from: r.alihStatusDataTable.nodinId,
            to: r.alihStatusNodinTable.id,
        }),

        persetujuan: r.one.alihStatusPersetujuanBupatiTable({
            from: r.alihStatusDataTable.persetujuanBupatiId,
            to: r.alihStatusPersetujuanBupatiTable.id,
        }),

        bast: r.one.alihStatusBASTTable({
            from: r.alihStatusDataTable.bastId,
            to: r.alihStatusBASTTable.id,
        }),

        permohonanPenghapusan: r.one.alihStatusPermohonanPenghapusanTable({
            from: r.alihStatusDataTable.permohonanPenghapusanId,
            to: r.alihStatusPermohonanPenghapusanTable.id,
        }),

        SKHapus: r.one.alihStatusSKHapusTable({
            from: r.alihStatusDataTable.SKHapusId,
            to: r.alihStatusSKHapusTable.id,
        }),
    },
}));