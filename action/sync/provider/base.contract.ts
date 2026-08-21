import { z } from "zod";

export const BaseCreateSyncJob = z.object({
    name: z.string().min(1),
    jobType: z.enum(["ebmd"]),
});
