import { ZodIssue } from "zod"; // Gunakan "zod" saja, v3 adalah standar sekarang

/**
 * Representasi error yang lebih spesifik untuk validasi (Zod) 
 * maupun error sistem (Drizzle/Database).
 */
export type ActionError = {
    message: string;
    code?: string; // Untuk error code seperti 'NOT_FOUND' atau 'UNAUTHORIZED'
    validation?: Record<string, string[]>; // Khusus untuk Zod field errors
};

export type ActionResponseSuccess<T> = {
    success: true;
    data: T;
    message?: string;
};

export type ActionResponseError = {
    success: false;
    error: ActionError; // Menggunakan objek terstruktur
};

export type ActionResponse<T> =
    | ActionResponseSuccess<T>
    | ActionResponseError;

/**
 * PAGINATION
 */
// export type PaginationMeta = {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
// };


export type PaginationInput<T> = {
    filter: T;
    page: number;
    limit: number;
};

export type PaginationResult<T> = {
    data: T;
    total: number;
};

// export type ResponsePaginated<T> = {
//     data: T[];
//     pagination: PaginationMeta;
// };

// export type ActionResponsePaginated<T> = ActionResponse<ResponsePaginated<T>>;

export class OperationalError extends Error {
    public readonly validation?: Record<string, string[]>;

    constructor(message: string, validation?: Record<string, string[]>) {
        super(message);
        this.name = "OperationalError";
        this.validation = validation;
    }
}

export function handleActionError(error: unknown): ActionResponse<never> {
    if (error instanceof OperationalError) {
        return {
            success: false,
            error: {
                message: error.message,
                code: "OPERATIONAL_ERROR",
                ...(error.validation && { validation: error.validation }),
            },
        };
    }

    console.error("[System Error]", error);
    return {
        success: false,
        error: {
            message: "Terjadi kesalahan sistem. Silakan coba lagi.",
            code: "INTERNAL_ERROR",
        },
    };
}