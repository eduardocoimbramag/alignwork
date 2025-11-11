import { api } from './api';
import { User, UserPublic, AuthTokens, LoginCredentials, RegisterData } from '../types/auth';

export const auth = {
    async register({ name, email, password }: { name: string; email: string; password: string }): Promise<User> {
        const response = await api<AuthTokens>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password,
                full_name: name
            })
        });

        // Após registro, buscar dados do usuário
        return await this.me();
    },

    async login({ email, password }: { email: string; password: string }): Promise<User> {
        const response = await api<AuthTokens>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        // Após login, buscar dados do usuário
        return await this.me();
    },

    async me(): Promise<User> {
        const user = await api<User>('/api/auth/me');
        return user;
    },

    async refresh(): Promise<User> {
        await api<AuthTokens>('/api/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({})
        });

        return await this.me();
    },

    async logout(): Promise<void> {
        await api('/api/auth/logout', {
            method: 'POST'
        });
    }
};
