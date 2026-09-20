import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

/*
withCredentials is on because the backend also sets the jwt in an httpOnly cookie.
The token from the login response is kept in memory as a fallback and sent in the
Authorization header, it is never written to localStorage.
 */
export const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
    authToken = token;
};

api.interceptors.request.use((config) => {
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
});

// pages subscribe to this so a dead session can send the user back to login
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;

export const setSessionExpiredHandler = (handler: SessionExpiredHandler | null) => {
    onSessionExpired = handler;
};

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const status = error.response?.status;
        const url = error.config?.url ?? '';

        // a failed login is not an expired session, so leave those alone
        if (status === 401 && !url.includes('/auth/sign-in')) {
            authToken = null;
            onSessionExpired?.();
        }
        return Promise.reject(error);
    },
);

/*
The backend sends validation and business errors as {field: message}, so pick the
first message out of it instead of showing a generic line everywhere.
 */
export const errorMessage = (error: unknown, fallback = 'Something went wrong, please try again.'): string => {
    if (!axios.isAxiosError(error)) return fallback;

    const data = error.response?.data;
    if (data && typeof data === 'object') {
        const values = Object.values(data as Record<string, unknown>).filter(
            (value): value is string => typeof value === 'string' && value.length > 0,
        );
        if (values.length > 0) return values[0];
    }

    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server, is the backend running?';
    return fallback;
};
