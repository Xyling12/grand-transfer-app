import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiFetch, setToken, removeToken, getToken } from '../services/api';
import type { Driver, AuthResponse } from '../types';

interface AuthState {
    user: Driver | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (phone: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<string>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

export interface RegisterData {
    phone: string;
    password: string;
    fullFio: string;
    role: 'DRIVER' | 'DISPATCHER';
    ptsNumber?: string;
    stsNumber?: string;
    carDescription?: string;
}

const AuthContext = createContext<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    login: async () => { },
    register: async () => '',
    logout: async () => { },
    refresh: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Driver | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) {
                setUser(null);
                return;
            }
            const data = await apiFetch<{ driver: Driver }>('/api/mobile/auth/me');
            if (data.driver) {
                setUser(data.driver);
            } else {
                // Unexpected response shape
                setUser(null);
                await removeToken();
            }
        } catch (err) {
            console.warn('Auth refresh failed:', err);
            setUser(null);
            // Don't remove token on network error — keep it for retry
            // Only remove if it was an auth error (401/403)
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                await refresh();
            } catch {
                // Ensure we never stay loading
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [refresh]);

    const login = useCallback(async (phone: string, password: string) => {
        const data = await apiFetch<AuthResponse>('/api/mobile/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone, password }),
        });
        if (data.token) {
            await setToken(data.token);
        }
        if (data.driver) {
            setUser(data.driver);
        }
    }, []);

    const register = useCallback(async (regData: RegisterData) => {
        const data = await apiFetch<AuthResponse>('/api/mobile/auth/register', {
            method: 'POST',
            body: JSON.stringify(regData),
        });
        return data.message || 'Регистрация отправлена';
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiFetch('/api/mobile/auth/logout', { method: 'POST' });
        } catch { }
        await removeToken();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user && user.status === 'APPROVED',
                login,
                register,
                logout,
                refresh,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
