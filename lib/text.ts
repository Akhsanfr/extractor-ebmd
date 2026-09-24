export const joinDenganDan = (items: string[]): string => {
    if (items.length <= 1) return items[0] ?? "";
    if (items.length === 2) return items.join(" dan ");

    return `${items.slice(0, -1).join(", ")}, dan ${items.at(-1)}`;
};