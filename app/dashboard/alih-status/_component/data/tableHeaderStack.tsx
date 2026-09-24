import { ReactNode } from "react";

export function TableHeaderStack({
    columns,
    align = "center",
}: {
    columns: ReactNode[];
    align?: "center" | "right";
}) {
    const [kolom1, ...rest] = columns;

    return (
        <div className={`flex flex-col ${align === "right" ? "items-end text-right" : "text-center"}`}>
            <span className="font-bold">{kolom1}</span>
            {rest.map((kolom, i) => (
                <span key={i} className="text-default-400 text-xs">
                    {kolom}
                </span>
            ))}
        </div>
    );
}