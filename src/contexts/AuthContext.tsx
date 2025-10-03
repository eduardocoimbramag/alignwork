import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserPublic, LoginCredentials, RegisterData, AuthContextType } from '../types/auth';
import { auth } from '../services/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserPublic | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;

    // Verificar status de autenticação na inicialização
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const userData = await auth.me();
                setUser(userData);
            } catch (error) {
                console.error('Auth check failed:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const doLogin = async (credentials: LoginCredentials): Promise<UserPublic> => {
        const userData = await auth.login(credentials);
        setUser(userData);
        return userData;
    };

    const login = async (credentials: LoginCredentials): Promise<void> => {
        try {
            setIsLoading(true);
            const userData = await auth.login(credentials);
            setUser(userData);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: RegisterData): Promise<void> => {
        try {
            setIsLoading(true);
            const userData = await auth.register({
                name: data.full_name || data.username,
                email: data.email,
                password: data.password
            });
            setUser(userData);
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            setIsLoading(true);
            await auth.logout();
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
            // Mesmo se o logout falhar no servidor, limpar o estado local
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshToken = async (): Promise<void> => {
        try {
            const userData = await auth.refresh();
            setUser(userData);
        } catch (error) {
            console.error('Token refresh failed:', error);
            setUser(null);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshToken,
        doLogin,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
