import { ReactNode } from "react";

export function TableCellStack({
    columns,
    align = "left",
}: {
    columns: (ReactNode | null | undefined)[];
    align?: "left" | "right";
}) {
    const [kolom1, ...rest] = columns;

    return (
        <div className={`flex flex-col ${align === "right" ? "items-end text-right" : ""}`}>
            <span>{kolom1}</span>
            {rest.map((kolom, i) => (
                <span key={i} className="text-muted text-xs">
                    {kolom}
                </span>
            ))}
        </div>
    );
}