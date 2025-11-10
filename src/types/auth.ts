export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    full_name?: string;  // Deprecated - manter para compatibilidade
    profile_photo_url?: string | null;
    phone_personal?: string | null;
    phone_professional?: string | null;
    phone_clinic?: string | null;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at?: string;
}

export interface UserUpdatePayload {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_personal?: string;
    phone_professional?: string;
    phone_clinic?: string;
    profile_photo_url?: string;
}

export interface UserPublic {
    id: string;
    name: string;
    email: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name?: string;
}

export interface AuthContextType {
    user: UserPublic | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    doLogin: (credentials: LoginCredentials) => Promise<UserPublic>;
}
