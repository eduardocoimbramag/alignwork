export interface Patient {
    id: number;
    tenant_id: string;
    name: string;
    cpf: string;
    phone: string;
    email?: string;
    address: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface PatientCreate {
    tenant_id: string;
    name: string;
    cpf: string;
    phone: string;
    email?: string;
    address: string;
    notes?: string;
}

export interface PatientUpdate {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
}

export interface PatientPaginatedResponse {
    data: Patient[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface FetchPatientsParams {
    tenantId: string;
    search?: string;
    page?: number;
    page_size?: number;
}

