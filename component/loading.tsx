import { Skeleton } from "@heroui/react";

export default function () {
    return <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-1/4" />
    </div>
}