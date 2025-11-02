export interface User {
    id: number;
    email: string;
    full_name?: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at?: string;
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
