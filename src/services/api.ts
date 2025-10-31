// API client usando fetch nativo com suporte a cookies httpOnly
import type { 
    Appointment, 
    AppointmentCreate, 
    AppointmentUpdate,
    AppointmentPaginatedResponse,
    FetchAppointmentsParams 
} from '@/types/appointment';

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface ApiResponse<T> {
    data: T;
    status: number;
    ok: boolean;
}

export class ApiError extends Error {
    status: number;
    detail?: any; // Pode ser string ou objeto com erros de validação
    response?: any; // Compatibilidade com código que espera response

    constructor(message: string, status: number, detail?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.detail = detail;
        // Criar objeto response para compatibilidade
        this.response = {
            status,
            data: { detail }
        };
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
            // Capturar todo o objeto detail para preservar erros de validação
            const detail = data?.detail || data?.message || 'Erro na requisição';
            throw new ApiError(
                typeof detail === 'string' ? detail : JSON.stringify(detail),
                response.status,
                detail // Passar o detail completo (pode ser array ou string)
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

// ============================================================================
// APPOINTMENTS API - P1-001
// ============================================================================

/**
 * Busca appointments com paginação
 */
export const fetchAppointments = async (
    params: FetchAppointmentsParams
): Promise<AppointmentPaginatedResponse> => {
    // Build query params
    const queryParams: Record<string, string | number> = {
        tenantId: params.tenantId,
        page: params.page || 1,
        page_size: params.page_size || 50,
    };

    if (params.from) {
        queryParams.from = params.from;
    }

    if (params.to) {
        queryParams.to = params.to;
    }

    // Fazer requisição
    const { data } = await api.get<AppointmentPaginatedResponse>(
        '/api/v1/appointments/',
        { 
            params: queryParams,
            headers: { 'Cache-Control': 'no-cache' }
        }
    );

    return data;
};

/**
 * Cria um novo appointment
 */
export const createAppointment = async (
    appointment: AppointmentCreate
): Promise<Appointment> => {
    const { data } = await api.post<Appointment>(
        '/api/v1/appointments/',
        appointment
    );
    return data;
};

/**
 * Atualiza status de um appointment
 */
export const updateAppointmentStatus = async (
    appointmentId: number,
    update: AppointmentUpdate
): Promise<Appointment> => {
    const { data } = await api.patch<Appointment>(
        `/api/v1/appointments/${appointmentId}`,
        update
    );
    return data;
};

// ============================================================================
// PATIENTS API
// ============================================================================

import type { Patient, PatientCreate, PatientPaginatedResponse, FetchPatientsParams } from '@/types/patient';

/**
 * Busca patients com paginação e busca
 */
export const fetchPatients = async (
    params: FetchPatientsParams
): Promise<PatientPaginatedResponse> => {
    const queryParams: Record<string, string | number> = {
        tenantId: params.tenantId,
        page: params.page || 1,
        page_size: params.page_size || 50,
    };

    if (params.search) {
        queryParams.search = params.search;
    }

    const { data } = await api.get<PatientPaginatedResponse>(
        '/api/v1/patients',
        {
            params: queryParams,
            headers: { 'Cache-Control': 'no-cache' }
        }
    );

    return data;
};

/**
 * Cria um novo patient
 */
export const createPatient = async (
    patient: PatientCreate
): Promise<Patient> => {
    const { data } = await api.post<Patient>(
        '/api/v1/patients',
        patient
    );
    return data;
};

/**
 * Busca um patient específico
 */
export const getPatient = async (
    patientId: number,
    tenantId: string
): Promise<Patient> => {
    const { data } = await api.get<Patient>(
        `/api/v1/patients/${patientId}`,
        {
            params: { tenantId },
            headers: { 'Cache-Control': 'no-cache' }
        }
    );
    return data;
};