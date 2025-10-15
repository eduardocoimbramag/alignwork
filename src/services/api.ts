// API client usando fetch nativo com suporte a cookies httpOnly
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface ApiResponse<T> {
    data: T;
    status: number;
    ok: boolean;
}

export class ApiError extends Error {
    status: number;
    detail?: string;

    constructor(message: string, status: number, detail?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.detail = detail;
    }
}

export async function api<T = any>(
    path: string,
    init: RequestInit = {}
): Promise<T> {
    const url = `${API_URL}${path}`;

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const config: RequestInit = {
        ...init,
        credentials: 'include',
        headers: {
            ...defaultHeaders,
            ...init.headers,
        },
    };

    try {
        const response = await fetch(url, config);

        // Verificar se a resposta é JSON
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        let data: any;
        if (isJson) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            throw new ApiError(
                data?.detail || data?.message || 'Erro na requisição',
                response.status,
                data?.detail
            );
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        // Erro de rede ou parsing
        throw new ApiError(
            'Erro de conexão com o servidor',
            0,
            error instanceof Error ? error.message : 'Erro desconhecido'
        );
    }
}

// Helper methods para facilitar o uso
api.get = async function <T = any>(
    path: string,
    options: { params?: Record<string, any>; headers?: HeadersInit } = {}
): Promise<ApiResponse<T>> {
    const { params, headers } = options;
    let url = path;

    if (params) {
        const queryString = new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null) {
                    acc[key] = String(value);
                }
                return acc;
            }, {} as Record<string, string>)
        ).toString();
        url = `${path}${queryString ? '?' + queryString : ''}`;
    }

    const data = await api<T>(url, { method: 'GET', headers });
    return { data, status: 200, ok: true };
};

api.post = async function <T = any>(
    path: string,
    body: any,
    options: { headers?: HeadersInit } = {}
): Promise<ApiResponse<T>> {
    const data = await api<T>(path, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: options.headers,
    });
    return { data, status: 201, ok: true };
};

api.patch = async function <T = any>(
    path: string,
    body: any,
    options: { headers?: HeadersInit } = {}
): Promise<ApiResponse<T>> {
    const data = await api<T>(path, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: options.headers,
    });
    return { data, status: 200, ok: true };
};