/**
 * api.test.ts — Deep tests for services/api.ts
 * Skill: javascript-testing-patterns
 * Patterns: vi.mock, vi.hoisted, async testing, timeout, error handling, AAA
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Hoist store reset fn before mocks
const mockStore = vi.hoisted(() => {
    const store: Record<string, string> = {};
    return {
        store,
        getItemAsync: vi.fn(async (k: string) => store[k] ?? null),
        setItemAsync: vi.fn(async (k: string, v: string) => { store[k] = v; }),
        deleteItemAsync: vi.fn(async (k: string) => { delete store[k]; }),
        reset: () => { for (const k in store) delete store[k]; },
    };
});

vi.mock('expo-secure-store', () => ({
    getItemAsync: mockStore.getItemAsync,
    setItemAsync: mockStore.setItemAsync,
    deleteItemAsync: mockStore.deleteItemAsync,
}));

// Default Platform.OS = ios (non-web)
const mockPlatform = vi.hoisted(() => ({ OS: 'ios' as string }));
vi.mock('react-native', () => ({ Platform: mockPlatform }));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { getToken, setToken, removeToken, apiFetch, apiUpload } from '../../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFetchResponse(body: object, status = 200): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: () => Promise.resolve(JSON.stringify(body)),
        json: () => Promise.resolve(body),
    } as unknown as Response;
}

// ─── getToken / setToken / removeToken ───────────────────────────────────────

describe('Token management (native iOS)', () => {
    beforeEach(() => {
        mockStore.reset();
        vi.clearAllMocks();
    });

    it('getToken() returns null when store is empty', async () => {
        expect(await getToken()).toBeNull();
    });

    it('setToken() stores the token', async () => {
        await setToken('my-jwt-token');
        expect(mockStore.setItemAsync).toHaveBeenCalledWith('gt_auth_token', 'my-jwt-token');
    });

    it('getToken() returns the stored token after setToken()', async () => {
        await setToken('token-abc');
        mockStore.getItemAsync.mockResolvedValueOnce('token-abc');
        expect(await getToken()).toBe('token-abc');
    });

    it('removeToken() deletes the stored token', async () => {
        await setToken('to-delete');
        await removeToken();
        expect(mockStore.deleteItemAsync).toHaveBeenCalledWith('gt_auth_token');
    });

    it('getToken() returns null after removeToken()', async () => {
        await setToken('to-delete');
        mockStore.getItemAsync.mockResolvedValueOnce(null as any); // simulating deleted
        await removeToken();
        expect(await getToken()).toBeNull();
    });

    it('getToken() returns null if SecureStore throws', async () => {
        mockStore.getItemAsync.mockRejectedValueOnce(new Error('Store error'));
        expect(await getToken()).toBeNull();
    });

    it('setToken() does not throw if SecureStore throws (warns instead)', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        mockStore.setItemAsync.mockRejectedValueOnce(new Error('Store error'));
        await expect(setToken('token')).resolves.not.toThrow();
        warnSpy.mockRestore();
    });

    it('removeToken() does not throw if SecureStore throws (warns instead)', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        mockStore.deleteItemAsync.mockRejectedValueOnce(new Error('Store error'));
        await expect(removeToken()).resolves.not.toThrow();
        warnSpy.mockRestore();
    });
});

describe('Token management (web platform)', () => {
    const localStorageMock: Record<string, string | null> = {};

    beforeEach(() => {
        mockPlatform.OS = 'web';
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((k: string) => localStorageMock[k] ?? null),
            setItem: vi.fn((k: string, v: string) => { localStorageMock[k] = v; }),
            removeItem: vi.fn((k: string) => { delete localStorageMock[k]; }),
        });
    });

    afterEach(() => {
        mockPlatform.OS = 'ios';
        vi.clearAllMocks();
    });

    it('getToken() uses localStorage on web', async () => {
        localStorageMock['gt_auth_token'] = 'web-token';
        const token = await getToken();
        expect(token).toBe('web-token');
    });

    it('setToken() uses localStorage on web', async () => {
        await setToken('web-jwt');
        expect(localStorage.setItem).toHaveBeenCalledWith('gt_auth_token', 'web-jwt');
    });

    it('removeToken() uses localStorage.removeItem on web', async () => {
        await removeToken();
        expect(localStorage.removeItem).toHaveBeenCalledWith('gt_auth_token');
    });
});

// ─── apiFetch ─────────────────────────────────────────────────────────────────

describe('apiFetch', () => {
    beforeEach(() => {
        mockStore.reset();
        mockStore.getItemAsync.mockResolvedValue(null as any); // no token by default
        mockPlatform.OS = 'ios';
        vi.clearAllMocks();
    });

    it('makes a GET request to the correct URL', async () => {
        mockFetch.mockResolvedValueOnce(makeFetchResponse({ data: 'ok' }));
        await apiFetch('/api/test');
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/test'),
            expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) })
        );
    });

    it('attaches Authorization header when token exists', async () => {
        mockStore.getItemAsync.mockResolvedValueOnce('Bearer-token-123');
        mockFetch.mockResolvedValueOnce(makeFetchResponse({ ok: true }));
        await apiFetch('/api/protected');
        const callArgs = mockFetch.mock.calls[0][1];
        expect(callArgs.headers['Authorization']).toBe('Bearer Bearer-token-123');
    });

    it('does NOT attach Authorization when no token', async () => {
        mockFetch.mockResolvedValueOnce(makeFetchResponse({ ok: true }));
        await apiFetch('/api/public');
        const callArgs = mockFetch.mock.calls[0][1];
        expect(callArgs.headers['Authorization']).toBeUndefined();
    });

    it('returns parsed JSON on success', async () => {
        const payload = { drivers: [{ id: 1, name: 'Иванов' }] };
        mockFetch.mockResolvedValueOnce(makeFetchResponse(payload));
        const result = await apiFetch<typeof payload>('/api/drivers');
        expect(result).toEqual(payload);
    });

    it('throws error on non-ok HTTP status', async () => {
        mockFetch.mockResolvedValueOnce(makeFetchResponse({ error: 'Не авторизован' }, 401));
        await expect(apiFetch('/api/me')).rejects.toThrow('Не авторизован');
    });

    it('throws generic HTTP error when no error field in response', async () => {
        mockFetch.mockResolvedValueOnce(makeFetchResponse({}, 500));
        await expect(apiFetch('/api/crash')).rejects.toThrow('HTTP 500');
    });

    it('throws "Неожиданный ответ сервера" on invalid JSON', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: () => Promise.resolve('not-json'),
        } as unknown as Response);
        await expect(apiFetch('/api/bad-json')).rejects.toThrow('Неожиданный ответ сервера');
    });

    it('throws "\u0421\u0435\u0440\u0432\u0435\u0440 \u043d\u0435 \u043e\u0442\u0432\u0435\u0447\u0430\u0435\u0442" on timeout (8s)', async () => {
        vi.useFakeTimers();
        // React to AbortSignal to avoid Unhandled Rejection after test
        mockFetch.mockImplementationOnce((_url: string, opts: RequestInit) =>
            new Promise((_resolve, reject) => {
                opts.signal?.addEventListener('abort', () =>
                    reject(new DOMException('Aborted', 'AbortError'))
                );
            })
        );
        const fetchPromise = apiFetch('/api/slow');
        await vi.advanceTimersByTimeAsync(9000);
        await expect(fetchPromise).rejects.toThrow('\u0421\u0435\u0440\u0432\u0435\u0440 \u043d\u0435 \u043e\u0442\u0432\u0435\u0447\u0430\u0435\u0442');
        vi.useRealTimers();
    });

    it('passes method and body to fetch', async () => {
        mockFetch.mockResolvedValueOnce(makeFetchResponse({ success: true }));
        await apiFetch('/api/order', {
            method: 'POST',
            body: JSON.stringify({ from: 'Ижевск', to: 'Казань' }),
        });
        const [, opts] = mockFetch.mock.calls[0];
        expect(opts.method).toBe('POST');
        expect(opts.body).toContain('Ижевск');
    });
});

// ─── apiUpload ────────────────────────────────────────────────────────────────

describe('apiUpload', () => {
    beforeEach(() => {
        mockStore.reset();
        mockStore.getItemAsync.mockResolvedValue(null as any);
        mockPlatform.OS = 'ios';
        vi.clearAllMocks();
    });

    it('uploads FormData with POST method', async () => {
        mockFetch.mockResolvedValueOnce(makeFetchResponse({ success: true }));
        const fd = new FormData();
        fd.append('file', 'blob-data');
        await apiUpload('/api/upload', fd);
        const [, opts] = mockFetch.mock.calls[0];
        expect(opts.method).toBe('POST');
        expect(opts.body).toBe(fd);
    });

    it('does NOT set Content-Type (lets browser set multipart boundary)', async () => {
        mockFetch.mockResolvedValueOnce(makeFetchResponse({ fileId: 'abc' }));
        const fd = new FormData();
        await apiUpload('/api/upload', fd);
        const [, opts] = mockFetch.mock.calls[0];
        expect(opts.headers['Content-Type']).toBeUndefined();
    });

    it('attaches Authorization header when token exists', async () => {
        mockStore.getItemAsync.mockResolvedValueOnce('upload-token');
        mockFetch.mockResolvedValueOnce(makeFetchResponse({ ok: true }));
        await apiUpload('/api/upload', new FormData());
        const [, opts] = mockFetch.mock.calls[0];
        expect(opts.headers['Authorization']).toBe('Bearer upload-token');
    });

    it('uses 30s timeout for uploads (not default 8s)', async () => {
        vi.useFakeTimers();
        // React to AbortSignal to avoid Unhandled Rejection after test
        mockFetch.mockImplementationOnce((_url: string, opts: RequestInit) =>
            new Promise((_resolve, reject) => {
                opts.signal?.addEventListener('abort', () =>
                    reject(new DOMException('Aborted', 'AbortError'))
                );
            })
        );
        const uploadPromise = apiUpload('/api/upload', new FormData());
        await vi.advanceTimersByTimeAsync(15000); // 15s — should NOT timeout yet (30s limit)
        await vi.advanceTimersByTimeAsync(20000); // total 35s — timeout fires now
        await expect(uploadPromise).rejects.toThrow('\u0421\u0435\u0440\u0432\u0435\u0440 \u043d\u0435 \u043e\u0442\u0432\u0435\u0447\u0430\u0435\u0442');
        vi.useRealTimers();
    });

    it('throws on non-ok HTTP status', async () => {
        mockFetch.mockResolvedValueOnce(makeFetchResponse({ error: 'Файл слишком большой' }, 413));
        await expect(apiUpload('/api/upload', new FormData())).rejects.toThrow('Файл слишком большой');
    });

    it('throws "Неожиданный ответ сервера" on invalid JSON response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: () => Promise.resolve('CORRUPTED'),
        } as unknown as Response);
        await expect(apiUpload('/api/upload', new FormData())).rejects.toThrow('Неожиданный ответ сервера');
    });
});
