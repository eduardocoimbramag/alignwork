export interface Appointment {
    id: number;
    tenant_id: string;
    patient_id: string;
    starts_at: string;
    duration_min: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    created_at: string;
    updated_at: string;
}

export interface AppointmentCreate {
    tenantId: string;
    patientId: string;
    startsAt: string;
    durationMin: number;
    status?: 'pending' | 'confirmed';
}

export interface AppointmentUpdate {
    status: 'pending' | 'confirmed' | 'cancelled';
}

// ============================================================================
// PAGINAÇÃO - P1-001
// ============================================================================

/**
 * Resposta paginada genérica
 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

/**
 * Resposta paginada específica para Appointments
 */
export interface AppointmentPaginatedResponse extends PaginatedResponse<Appointment> {}

/**
 * Parâmetros para requisições paginadas
 */
export interface PaginationParams {
    page?: number;
    page_size?: number;
}

/**
 * Parâmetros completos para fetchAppointments
 */
export interface FetchAppointmentsParams extends PaginationParams {
    tenantId: string;
    from?: string;
    to?: string;
}

