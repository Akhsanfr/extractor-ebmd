export const StatusBhumi = {
    sudahPlotting: "sudahPlotting",
    belumPlotting: "belumPlotting",
    salahPlotting: "salahPlotting",
} as const;

export type StatusBhumi = typeof StatusBhumi[keyof typeof StatusBhumi];