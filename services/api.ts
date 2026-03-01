import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/Api';

const TOKEN_KEY = 'gt_auth_token';
const TIMEOUT_MS = 8000; // 8 second timeout

export async function getToken(): Promise<string | null> {
    try {
        if (Platform.OS === 'web') {
            return localStorage.getItem(TOKEN_KEY);
        }
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
        return null;
    }
}

export async function setToken(token: string): Promise<void> {
    try {
        if (Platform.OS === 'web') {
            localStorage.setItem(TOKEN_KEY, token);
            return;
        }
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
        console.warn('Failed to save token', e);
    }
}

export async function removeToken(): Promise<void> {
    try {
        if (Platform.OS === 'web') {
            localStorage.removeItem(TOKEN_KEY);
            return;
        }
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
        console.warn('Failed to remove token', e);
    }
}

function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = TIMEOUT_MS): Promise<Response> {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            controller.abort();
            reject(new Error('Сервер не отвечает'));
        }, timeoutMs);

        fetch(url, { ...options, signal: controller.signal })
            .then(res => { clearTimeout(timer); resolve(res); })
            .catch(err => { clearTimeout(timer); reject(err); });
    });
}

export async function apiFetch<T = any>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    });

    const text = await response.text();
    let data: any;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(`Неожиданный ответ сервера`);
    }

    if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data as T;
}

export async function apiUpload<T = any>(
    path: string,
    formData: FormData
): Promise<T> {
    const token = await getToken();
    const headers: Record<string, string> = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: formData,
    }, 30000); // 30s for uploads

    const text = await response.text();
    let data: any;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(`Неожиданный ответ сервера`);
    }

    if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data as T;
}
