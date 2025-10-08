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

