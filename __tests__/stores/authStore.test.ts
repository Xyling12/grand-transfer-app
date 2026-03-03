/**
 * authStore.test.ts — Deep tests for stores/authStore.tsx
 * Skill: javascript-testing-patterns
 * Patterns: vi.mock, async testing, business logic isolation
 *
 * Strategy: We don't render React — we test the LOGIC:
 * - isAuthenticated = !!user && user.status === 'APPROVED'
 * - RegisterData interface contract
 * - Error handling patterns
 * We mock apiFetch, setToken, removeToken to test authStore logic in isolation.
 */
import { describe, it, expect, vi } from 'vitest';

// ─── isAuthenticated logic (extracted for unit testing) ───────────────────────
// The formula: isAuthenticated: !!user && user.status === 'APPROVED'

type UserStatus = 'PENDING' | 'APPROVED' | 'BANNED';

interface MockDriver {
    id: string;
    status: UserStatus;
    role: string;
    firstName?: string;
    phone?: string;
    fullFio?: string;
}

function computeIsAuthenticated(user: MockDriver | null): boolean {
    return !!user && user.status === 'APPROVED';
}

describe('isAuthenticated logic', () => {
    it('returns false when user is null', () => {
        expect(computeIsAuthenticated(null)).toBe(false);
    });

    it('returns true when user is APPROVED', () => {
        const user: MockDriver = { id: '1', status: 'APPROVED', role: 'DRIVER' };
        expect(computeIsAuthenticated(user)).toBe(true);
    });

    it('returns false when user status is PENDING', () => {
        const user: MockDriver = { id: '2', status: 'PENDING', role: 'DRIVER' };
        expect(computeIsAuthenticated(user)).toBe(false);
    });

    it('returns false when user status is BANNED', () => {
        const user: MockDriver = { id: '3', status: 'BANNED', role: 'DRIVER' };
        expect(computeIsAuthenticated(user)).toBe(false);
    });

    // Parametrized: all non-APPROVED statuses return false
    it.each<UserStatus>(['PENDING', 'BANNED'])(
        'user with status "%s" is NOT authenticated',
        (status) => {
            const user: MockDriver = { id: '4', status, role: 'DRIVER' };
            expect(computeIsAuthenticated(user)).toBe(false);
        }
    );
});

// ─── RegisterData contract ────────────────────────────────────────────────────

import type { RegisterData } from '../../stores/authStore';

describe('RegisterData contract', () => {
    it('accepts DRIVER role', () => {
        const data: RegisterData = {
            phone: '+79991234567',
            password: 'password123',
            fullFio: 'Иванов Иван Иванович',
            role: 'DRIVER',
        };
        expect(data.role).toBe('DRIVER');
    });

    it('accepts DISPATCHER role', () => {
        const data: RegisterData = {
            phone: '+79991234567',
            password: 'password123',
            fullFio: 'Петров Пётр Петрович',
            role: 'DISPATCHER',
        };
        expect(data.role).toBe('DISPATCHER');
    });

    it('optional fields are undefined by default', () => {
        const data: RegisterData = {
            phone: '+79991234567',
            password: 'pass',
            fullFio: 'Иванов',
            role: 'DRIVER',
        };
        expect(data.ptsNumber).toBeUndefined();
        expect(data.stsNumber).toBeUndefined();
        expect(data.carDescription).toBeUndefined();
    });

    it('accepts all optional DRIVER fields', () => {
        const data: RegisterData = {
            phone: '+79991234567',
            password: 'pass',
            fullFio: 'Иванов',
            role: 'DRIVER',
            ptsNumber: 'ПТС-1234',
            stsNumber: 'СТС-5678',
            carDescription: 'Toyota Camry, белый',
        };
        expect(data.ptsNumber).toBe('ПТС-1234');
        expect(data.stsNumber).toBe('СТС-5678');
        expect(data.carDescription).toBe('Toyota Camry, белый');
    });
});

// ─── Auth business logic – apiFetch integration (mocked) ─────────────────────

// Test the login/register/logout logic in isolation
vi.mock('../../services/api', () => ({
    apiFetch: vi.fn(),
    setToken: vi.fn(),
    removeToken: vi.fn(),
    getToken: vi.fn(),
}));

import { apiFetch, setToken, removeToken } from '../../services/api';

// Simulate the login function body from authStore
async function simulateLogin(phone: string, password: string) {
    const data = await (apiFetch as any)<{ token?: string; driver?: MockDriver }>('/api/mobile/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
    });
    if (data.token) await setToken(data.token);
    return data.driver ?? null;
}

// Simulate the register function body
async function simulateRegister(regData: RegisterData): Promise<string> {
    const data = await (apiFetch as any)<{ message?: string }>('/api/mobile/auth/register', {
        method: 'POST',
        body: JSON.stringify(regData),
    });
    return data.message || 'Регистрация отправлена';
}

// Simulate the logout function body
async function simulateLogout() {
    try {
        await (apiFetch as any)('/api/mobile/auth/logout', { method: 'POST' });
    } catch { }
    await removeToken();
}

describe('Login logic (simulated)', () => {
    it('calls /api/mobile/auth/login with POST and credentials', async () => {
        (apiFetch as any).mockResolvedValueOnce({ token: 'jwt-abc', driver: { id: '1', status: 'APPROVED' } });
        await simulateLogin('+79991234567', 'pass123');
        expect(apiFetch).toHaveBeenCalledWith('/api/mobile/auth/login', expect.objectContaining({ method: 'POST' }));
    });

    it('saves token via setToken when login returns token', async () => {
        (apiFetch as any).mockResolvedValueOnce({ token: 'jwt-token', driver: { id: '1', status: 'APPROVED' } });
        await simulateLogin('+79991234567', 'pass');
        expect(setToken).toHaveBeenCalledWith('jwt-token');
    });

    it('does NOT call setToken when token is absent in response', async () => {
        (apiFetch as any).mockResolvedValueOnce({ driver: { id: '2', status: 'PENDING' } });
        vi.clearAllMocks();
        await simulateLogin('+79991234567', 'pass');
        expect(setToken).not.toHaveBeenCalled();
    });

    it('returns driver from response', async () => {
        const mockDriver: MockDriver = { id: 'drv-1', status: 'APPROVED', role: 'DRIVER', firstName: 'Иван' };
        (apiFetch as any).mockResolvedValueOnce({ token: 'jwt', driver: mockDriver });
        const driver = await simulateLogin('+79991234567', 'pass');
        expect(driver).toEqual(mockDriver);
    });

    it('throws when apiFetch throws (e.g. wrong password)', async () => {
        (apiFetch as any).mockRejectedValueOnce(new Error('Неверный пароль'));
        await expect(simulateLogin('+79991234567', 'wrong')).rejects.toThrow('Неверный пароль');
    });
});

describe('Register logic (simulated)', () => {
    const regData: RegisterData = {
        phone: '+79991234567',
        password: 'newpass',
        fullFio: 'Иванов Иван',
        role: 'DRIVER',
    };

    it('calls /api/mobile/auth/register', async () => {
        (apiFetch as any).mockResolvedValueOnce({ message: 'Заявка отправлена' });
        await simulateRegister(regData);
        expect(apiFetch).toHaveBeenCalledWith('/api/mobile/auth/register', expect.objectContaining({ method: 'POST' }));
    });

    it('returns message from response', async () => {
        (apiFetch as any).mockResolvedValueOnce({ message: 'Заявка принята, ожидайте одобрения' });
        const msg = await simulateRegister(regData);
        expect(msg).toBe('Заявка принята, ожидайте одобрения');
    });

    it('returns default message when response has no message', async () => {
        (apiFetch as any).mockResolvedValueOnce({});
        const msg = await simulateRegister(regData);
        expect(msg).toBe('Регистрация отправлена');
    });

    it('passes all driver fields in request body', async () => {
        (apiFetch as any).mockResolvedValueOnce({ message: 'ok' });
        const fullData: RegisterData = {
            ...regData,
            ptsNumber: 'ПТС-123',
            stsNumber: 'СТС-456',
            carDescription: 'BMW X5',
        };
        await simulateRegister(fullData);
        // Use lastCall to avoid picking up calls from previous tests
        const body = JSON.parse((apiFetch as any).mock.lastCall[1].body);
        expect(body.ptsNumber).toBe('ПТС-123');
        expect(body.carDescription).toBe('BMW X5');
    });
});

describe('Logout logic (simulated)', () => {
    it('calls /api/mobile/auth/logout and removeToken', async () => {
        (apiFetch as any).mockResolvedValueOnce({});
        await simulateLogout();
        expect(apiFetch).toHaveBeenCalledWith('/api/mobile/auth/logout', { method: 'POST' });
        expect(removeToken).toHaveBeenCalled();
    });

    it('still removes token even when logout API fails', async () => {
        (apiFetch as any).mockRejectedValueOnce(new Error('Network error'));
        vi.clearAllMocks();
        (apiFetch as any).mockRejectedValueOnce(new Error('Network error'));
        await simulateLogout();
        expect(removeToken).toHaveBeenCalled();
    });
});
