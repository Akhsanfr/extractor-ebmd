"use client";

import { Card, Typography } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

export type DescriptionItem = {
    label: string;
    value: ReactNode;
    icon?: ReactNode;
};

/** Satu baris penuh, atau beberapa item digabung berdampingan dalam satu baris */
type DescriptionRow = DescriptionItem | DescriptionItem[];

type DescriptionProps = {
    items: DescriptionRow[];
    variant?: ComponentProps<typeof Card>["variant"];
    className?: string;
};

function DescriptionItemRow({ item, align = "left" }: { item: DescriptionItem; align?: "left" | "right" }) {
    const isRight = align === "right";

    return (
        <div className={`flex items-start gap-2 ${isRight ? "flex-row-reverse" : "flex-row"}`}>
            <span className="text-muted-foreground flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">
                {item.icon}
            </span>
            <div
                className={`flex min-w-0 flex-col ${isRight ? "items-end text-right" : "items-start text-left"}`}
            >
                <Typography type="body-xs" color="muted">
                    {item.label}
                </Typography>
                <Typography type="body" weight="bold" className="break-words">
                    {item.value}
                </Typography>
            </div>
        </div>
    );
}

export function Description({ items, variant = "secondary", className }: DescriptionProps) {
    return (
        <Card variant={variant} className={className}>
            <Card.Content className="flex flex-col gap-4">
                {items.map((row, index) =>
                    Array.isArray(row) ? (
                        <div key={index} className="flex flex-row justify-between gap-6">
                            {row.map((item, subIndex) => (
                                <div key={subIndex} className="flex-1">
                                    <DescriptionItemRow
                                        item={item}
                                        align={row.length > 1 && subIndex === row.length - 1 ? "right" : "left"}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <DescriptionItemRow key={index} item={row} />
                    ),
                )}
            </Card.Content>
        </Card>
    );
}