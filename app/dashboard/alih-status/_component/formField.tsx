"use client";

import { ComponentPropsWithoutRef, useEffect, useState } from "react";
import { Controller, Control, FieldValues, FieldErrors, Path } from "react-hook-form";
import { NumericFormat, NumericFormatProps } from "react-number-format";
import {
    useFilter,
    Autocomplete,
    SearchField,
    Description,
    ListBox,
    TextField,
    Label,
    Input,
    ErrorMessage,
    TextArea,
    Checkbox,
    FieldError,
    Select,
    Key,
} from "@heroui/react";

function fieldErrorMessage(errors: FieldErrors<FieldValues>, name: string): string | undefined {
    const error = errors[name];
    return error?.message as string | undefined;
}

// ---------------------------------------------------------------------------
// Prop pass-through helpers
// Ambil tipe props asli tiap komponen HeroUI, lalu buang prop yang sudah kita
// kontrol sendiri lewat react-hook-form's Controller (value/onChange/onBlur/ref).
// Sisanya (readOnly, isDisabled, placeholder, maxLength, dst) bisa langsung
// dipakai oleh konsumen field tanpa kita deklarasikan satu-satu.
// ---------------------------------------------------------------------------
type ManagedProps = "value" | "onChange" | "onBlur" | "ref";

type InputHeroProps = Omit<ComponentPropsWithoutRef<typeof Input>, ManagedProps>;
type TextAreaHeroProps = Omit<ComponentPropsWithoutRef<typeof TextArea>, ManagedProps>;
type AutocompleteHeroProps = Omit<ComponentPropsWithoutRef<typeof Autocomplete>, ManagedProps | "children" | "selectionMode">;
type SelectHeroProps = Omit<ComponentPropsWithoutRef<typeof Select>, ManagedProps | "children" | "selectionMode">;
type CheckboxHeroProps = Omit<ComponentPropsWithoutRef<typeof Checkbox>, ManagedProps | "children" | "isSelected" | "onChange">;

/**
 * NumericFormat (react-number-format) punya tipe internal sendiri yang lebih
 * sempit dari HTML native <input> (mis. `type` cuma "text"|"tel"|"password",
 * `defaultValue` cuma string|number). Jadi NumberFormField TIDAK mewarisi
 * InputHeroProps mentah — cukup subset prop <input> yang memang kompatibel
 * dan berguna di sini (readOnly, isDisabled, placeholder, className, dst),
 * plus semua opsi format dari NumericFormatProps sendiri.
 */
type NumberFormatOwnProps = Omit<
    NumericFormatProps,
    "value" | "onValueChange" | "customInput" | "getInputRef" | "type" | "defaultValue" | "onChange"
>;

/**
 * Segment-based formatter: splits raw input into fixed-type, fixed-max-length
 * segments (digits and/or letters) joined by a separator, e.g.
 *   nip:   "200001012022011002" -> "20000101 202201 1 002"   (digit segments)
 *   nopol: "L1234AB"            -> "L 1234 AB"               (letter/digit/letter)
 * The *raw* (unspaced) value is what gets stored in the form field via
 * field.onChange — only the on-screen display is formatted. A char is
 * assigned to a segment as long as it matches that segment's type and the
 * segment hasn't hit its max length yet; otherwise formatting moves on to
 * the next segment. `min` is informational (for validation elsewhere) and
 * isn't enforced while typing.
 */
export type FormatSegment = { type: "digit" | "letter"; min: number; max: number };
export type FieldSegmentFormat = { segments: FormatSegment[]; separator?: string; uppercase?: boolean };
/** @deprecated use FieldSegmentFormat */
export type DigitGroupFormat = FieldSegmentFormat;

const FORMAT_PRESETS: Record<string, FieldSegmentFormat> = {
    // 8 (tanggal lahir) + 6 (TMT) + 1 (jenis kelamin) + 3 (nomor urut)
    nip: {
        segments: [
            { type: "digit", min: 8, max: 8 },
            { type: "digit", min: 6, max: 6 },
            { type: "digit", min: 1, max: 1 },
            { type: "digit", min: 3, max: 3 },
        ],
        separator: " ",
    },
    // Plat nomor: 1-2 huruf kode wilayah, 1-4 angka, 1-3 huruf seri
    nopol: {
        segments: [
            { type: "letter", min: 1, max: 2 },
            { type: "digit", min: 1, max: 4 },
            { type: "letter", min: 1, max: 3 },
        ],
        separator: " ",
        uppercase: true,
    },
};

function resolveFormat(format: string | FieldSegmentFormat | undefined): FieldSegmentFormat | undefined {
    if (!format) return undefined;
    return typeof format === "string" ? FORMAT_PRESETS[format] : format;
}

function matchesSegmentType(ch: string, type: FormatSegment["type"]): boolean {
    return type === "digit" ? /[0-9]/.test(ch) : /[a-zA-Z]/.test(ch);
}

/** Strips characters that don't belong to any of the format's segment types. */
function sanitizeChars(input: string, format: FieldSegmentFormat): string {
    const source = format.uppercase ? input.toUpperCase() : input;
    return source
        .split("")
        .filter((ch) => format.segments.some((seg) => matchesSegmentType(ch, seg.type)))
        .join("");
}

/** Greedily assigns already-sanitized characters to segments in order. */
function splitIntoSegments(sanitized: string, format: FieldSegmentFormat): string[] {
    const parts: string[] = [];
    let buffer = "";
    let segIdx = 0;
    let idx = 0;

    while (idx < sanitized.length && segIdx < format.segments.length) {
        const seg = format.segments[segIdx];
        const ch = sanitized[idx];

        if (matchesSegmentType(ch, seg.type) && buffer.length < seg.max) {
            buffer += ch;
            idx++;
        } else {
            parts.push(buffer);
            buffer = "";
            segIdx++;
        }
    }
    if (buffer) parts.push(buffer);

    return parts;
}

/** Raw (unspaced) value to store in the form field, given whatever the user typed/pasted. */
function parseFormattedValue(input: string, format: FieldSegmentFormat): string {
    return splitIntoSegments(sanitizeChars(input, format), format).join("");
}

/** On-screen display value, given the raw value already stored in the form field. */
function formatSegments(raw: string, format: FieldSegmentFormat): string {
    return splitIntoSegments(raw, format).filter(Boolean).join(format.separator ?? " ");
}

/**
 * Remembers previously typed values per field (localStorage, per-browser) so
 * they can be offered back as <datalist> suggestions the next time the same
 * field is used. Not shared across users/devices — purely a local convenience.
 */
function useFieldSuggestions(storageKey: string | undefined, maxItems = 10) {
    const [suggestions, setSuggestions] = useState<string[]>([]);

    useEffect(() => {
        if (!storageKey || typeof window === "undefined") return;
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (raw) setSuggestions(JSON.parse(raw));
        } catch {
            // ignore malformed/blocked storage
        }
    }, [storageKey]);

    const remember = (value: string) => {
        if (!storageKey || typeof window === "undefined") return;
        const trimmed = value.trim();
        if (!trimmed) return;

        setSuggestions((prev) => {
            const next = [trimmed, ...prev.filter((v) => v !== trimmed)].slice(0, maxItems);
            try {
                window.localStorage.setItem(storageKey, JSON.stringify(next));
            } catch {
                // ignore quota errors
            }
            return next;
        });
    };

    return { suggestions, remember };
}

// ---------------------------------------------------------------------------
// TextFormField — text/date input, dengan dukungan segment format (NIP/NOPOL)
// ---------------------------------------------------------------------------
export function TextFormField<TValues extends FieldValues>({
    control,
    errors,
    name,
    label,
    type = "text",
    className,
    suggestions: suggestionsEnabled = false,
    format,
    ...inputProps
}: {
    control: Control<TValues>;
    errors: FieldErrors<TValues>;
    name: Path<TValues>;
    label: string;
    type?: "text" | "date";
    /** e.g. "col-span-4" when the parent's body uses a grid layout. */
    className?: string;
    /** Remember previously typed values for this field and offer them as suggestions. */
    suggestions?: boolean;
    /** Preset ("nip", "nopol") or custom segment format. Field value stays the raw (unspaced) characters. */
    format?: keyof typeof FORMAT_PRESETS | FieldSegmentFormat;
} & Omit<InputHeroProps, "type">) {
    const storageKey = suggestionsEnabled ? `field-suggestions:${String(name)}` : undefined;
    const { suggestions, remember } = useFieldSuggestions(storageKey);
    const listId = `${String(name)}-suggestions`;
    const groupFormat = resolveFormat(format);
    const isReadOnly = Boolean(inputProps.readOnly);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const errorMessage = fieldErrorMessage(errors, name);

                if (groupFormat) {
                    const rawValue = (field.value as string | undefined) ?? "";

                    return (
                        <TextField className={className} isReadOnly={isReadOnly}>
                            <Label>{label}</Label>
                            <Input
                                type="text"
                                inputMode={groupFormat.segments.every((s) => s.type === "digit") ? "numeric" : "text"}
                                list={suggestionsEnabled ? listId : undefined}
                                value={formatSegments(rawValue, groupFormat)}
                                onChange={(e) => {
                                    if (isReadOnly) return;
                                    field.onChange(parseFormattedValue(e.target.value, groupFormat));
                                }}
                                onBlur={(e) => {
                                    if (suggestionsEnabled) remember(e.target.value);
                                    field.onBlur();
                                }}
                                ref={field.ref}
                                {...inputProps}
                            />
                            {suggestionsEnabled && (
                                <datalist id={listId}>
                                    {suggestions.map((s) => (
                                        <option key={s} value={s} />
                                    ))}
                                </datalist>
                            )}
                            <ErrorMessage>
                                {Boolean(errorMessage) && <>{errorMessage}</>}
                            </ErrorMessage>
                        </TextField>
                    );
                }

                return (
                    <TextField className={className} isReadOnly={isReadOnly}>
                        <Label>{label}</Label>
                        <Input
                            type={type}
                            list={suggestionsEnabled ? listId : undefined}
                            value={(field.value as string | undefined) ?? ""}
                            onChange={(e) => {
                                if (isReadOnly) return;
                                field.onChange(e.target.value);
                            }}
                            onBlur={(e) => {
                                if (suggestionsEnabled) remember(e.target.value);
                                field.onBlur();
                            }}
                            ref={field.ref}
                            {...inputProps}
                        />
                        {suggestionsEnabled && (
                            <datalist id={listId}>
                                {suggestions.map((s) => (
                                    <option key={s} value={s} />
                                ))}
                            </datalist>
                        )}
                        <ErrorMessage>
                            {Boolean(errorMessage) && <>{errorMessage}</>}
                        </ErrorMessage>
                    </TextField>
                );
            }}
        />
    );
}

// ---------------------------------------------------------------------------
// NumberFormField — dedicated, dibangun di atas react-number-format
// ---------------------------------------------------------------------------
export function NumberFormField<TValues extends FieldValues>({
    control,
    errors,
    name,
    label,
    className,
    readOnly,
    isDisabled,
    placeholder,
    onChange, // ⬅️ baru — dipanggil setelah field.onChange, bawa nilai angka terbaru
    ...numberFormat
}: {
    control: Control<TValues>;
    errors: FieldErrors<TValues>;
    name: Path<TValues>;
    label: string;
    className?: string;
    readOnly?: boolean;
    isDisabled?: boolean;
    placeholder?: string;
    /** Dipanggil tiap kali nilai berubah (setelah disimpan ke form). Berguna untuk field turunan seperti nilaiBuku. */
    onChange?: (value: number | undefined) => void;
} & NumberFormatOwnProps) {
    const isReadOnly = Boolean(readOnly);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const errorMessage = fieldErrorMessage(errors, name);

                return (
                    <TextField className={className} isReadOnly={isReadOnly}>
                        <Label>{label}</Label>
                        <NumericFormat
                            customInput={Input}
                            value={(field.value as number | undefined) ?? ""}
                            onValueChange={(values) => {
                                if (isReadOnly || isDisabled) return;
                                field.onChange(values.floatValue);
                                onChange?.(values.floatValue); // ⬅️ panggil setelah update form field
                            }}
                            onBlur={field.onBlur}
                            getInputRef={field.ref}
                            thousandSeparator="."
                            decimalSeparator=","
                            allowNegative={false}
                            readOnly={isReadOnly}
                            disabled={isDisabled}
                            placeholder={placeholder}
                            {...numberFormat}
                        />
                        <ErrorMessage>
                            {Boolean(errorMessage) && <>{errorMessage}</>}
                        </ErrorMessage>
                    </TextField>
                );
            }}
        />
    );
}

// ---------------------------------------------------------------------------
// TextAreaFormField
// ---------------------------------------------------------------------------
export function TextAreaFormField<TValues extends FieldValues>({
    control,
    errors,
    name,
    label,
    className,
    ...areaProps
}: {
    control: Control<TValues>;
    errors: FieldErrors<TValues>;
    name: Path<TValues>;
    label: string;
    className?: string;
} & TextAreaHeroProps) {
    const isReadOnly = Boolean(areaProps.readOnly);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <TextField className={className} isReadOnly={isReadOnly}>
                    <Label>{label}</Label>
                    <TextArea
                        value={(field.value as string | undefined) ?? ""}
                        onChange={(e) => {
                            if (isReadOnly) return;
                            field.onChange(e);
                        }}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        {...areaProps}
                    />
                    <ErrorMessage>
                        {Boolean(fieldErrorMessage(errors, name)) && <>{fieldErrorMessage(errors, name)}</>}
                    </ErrorMessage>
                </TextField>
            )}
        />
    );
}

// ---------------------------------------------------------------------------
// AutocompleteFormField
// ---------------------------------------------------------------------------
export type AutocompleteOption = {
    label: string;
    value: string | number;
};

export function AutocompleteFormField<TValues extends FieldValues>({
    control,
    selectionMode = "single",
    errors,
    name,
    label,
    options,
    className,
    placeholder = "Pilih opsi...",
    onChange,
    ...autoProps
}: {
    control: Control<TValues>;
    selectionMode?: "single" | "multiple";
    errors: FieldErrors<TValues>;
    name: Path<TValues>;
    label: string;
    options: AutocompleteOption[];
    className?: string;
    placeholder?: string;
    onChange?: (value: Key | Key[] | null) => void;
} & AutocompleteHeroProps) {
    const { contains } = useFilter({
        sensitivity: "base",
    });
    const isDisabled = Boolean(autoProps.isDisabled);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const errorMessage = fieldErrorMessage(errors, name);
                const isInvalid = Boolean(errorMessage);

                return (
                    <div className={className}>
                        <Autocomplete
                            value={field.value}
                            onChange={(value) => {
                                if (isDisabled) return;
                                onChange && onChange(value);
                                field.onChange(value);
                            }}
                            onBlur={field.onBlur}
                            selectionMode={selectionMode}
                            placeholder={placeholder}
                            {...autoProps}
                        >
                            <Label>{label}</Label>

                            <Autocomplete.Trigger>
                                <Autocomplete.Value />
                                <Autocomplete.ClearButton />
                                <Autocomplete.Indicator />
                            </Autocomplete.Trigger>

                            {isInvalid && (
                                <Description className="mt-1 text-sm text-red-500">
                                    {errorMessage}
                                </Description>
                            )}

                            <Autocomplete.Popover>
                                <Autocomplete.Filter filter={contains}>
                                    <SearchField
                                        autoFocus
                                        aria-label={`Cari ${label}`}
                                        name="search"
                                        variant="secondary"
                                    >
                                        <SearchField.Group>
                                            <SearchField.SearchIcon />
                                            <SearchField.Input placeholder="Cari..." />
                                            <SearchField.ClearButton />
                                        </SearchField.Group>
                                    </SearchField>

                                    <ListBox
                                        renderEmptyState={() => (
                                            <div className="p-3 text-sm text-muted">
                                                Tidak ada data ditemukan
                                            </div>
                                        )}
                                    >
                                        {options.map((option) => (
                                            <ListBox.Item
                                                key={String(option.value)}
                                                id={String(option.value)}
                                                textValue={option.label}
                                            >
                                                <Label>{option.label}</Label>
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                        ))}
                                    </ListBox>
                                </Autocomplete.Filter>
                            </Autocomplete.Popover>
                        </Autocomplete>
                    </div>
                );
            }}
        />
    );
}

// ---------------------------------------------------------------------------
// CheckboxFormField
// ---------------------------------------------------------------------------
export function CheckboxFormField<TValues extends FieldValues>({
    control,
    errors,
    name,
    label,
    description,
    className,
    ...checkboxProps
}: {
    control: Control<TValues>;
    errors: FieldErrors<TValues>;
    name: Path<TValues>;
    label: string;
    description?: string;
    className?: string;
} & CheckboxHeroProps) {
    const isDisabled = Boolean(checkboxProps.isDisabled);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <Checkbox
                    className={className}
                    isSelected={Boolean(field.value)}
                    onChange={(isSelected) => {
                        if (isDisabled) return;
                        field.onChange(isSelected);
                    }}
                    {...checkboxProps}
                >
                    <Checkbox.Content>
                        <Checkbox.Control>
                            <Checkbox.Indicator />
                        </Checkbox.Control>

                        {label}
                    </Checkbox.Content>

                    {description && (
                        <Description>
                            {description}
                        </Description>
                    )}

                    <FieldError>
                        {Boolean(fieldErrorMessage(errors, name)) && (
                            <>
                                {fieldErrorMessage(errors, name)}
                            </>
                        )}
                    </FieldError>
                </Checkbox>
            )}
        />
    );
}

// ---------------------------------------------------------------------------
// SelectFormField
// ---------------------------------------------------------------------------
export function SelectFormField<TValues extends FieldValues>({
    control,
    selectionMode = "single",
    errors,
    name,
    label,
    options,
    className,
    description,
    placeholder = "Pilih opsi...",
    ...selectProps
}: {
    control: Control<TValues>;
    selectionMode?: "single" | "multiple";
    errors: FieldErrors<TValues>;
    name: Path<TValues>;
    label: string;
    options: AutocompleteOption[];
    className?: string;
    description?: string;
    placeholder?: string;
} & SelectHeroProps) {
    const isDisabled = Boolean(selectProps.isDisabled);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const errorMessage = fieldErrorMessage(errors, name);
                const isInvalid = Boolean(errorMessage);

                return (
                    <div className={className}>
                        <Select
                            value={field.value as (string | number)[]}
                            onChange={(value) => {
                                if (isDisabled) return;
                                field.onChange(value);
                            }}
                            onBlur={field.onBlur}
                            selectionMode={selectionMode}
                            {...selectProps}
                        >
                            <Label>{label}</Label>
                            <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Description />
                            <Select.Popover>
                                <ListBox>
                                    {options.map((option) => (
                                        <ListBox.Item
                                            key={option.value}
                                            id={String(option.value)}
                                            textValue={option.label}
                                        >
                                            <Label>{option.label}</Label>
                                            <Description />
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Select.Popover>
                        </Select>
                        {description && (
                            <Description>
                                {description}
                            </Description>
                        )}

                        <FieldError>
                            {Boolean(fieldErrorMessage(errors, name)) && (
                                <>
                                    {fieldErrorMessage(errors, name)}
                                </>
                            )}
                        </FieldError>
                    </div>
                );
            }}
        />
    );
}