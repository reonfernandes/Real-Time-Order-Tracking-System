import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { setAuthToken, setSessionExpiredHandler } from '../api/client';
import { signIn, signOut, signUp } from '../api/auth.api';
import { fetchUsers } from '../api/admin.api';
import type { SignUpRequest } from '../types';

interface Session {
    email: string;
    name: string;
    isAdmin: boolean;
}

interface AuthContextValue {
    session: Session | null;
    booting: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (payload: SignUpRequest) => Promise<void>;
    logout: () => Promise<void>;
}

const STORAGE_KEY = 'ordertrack.session';

const AuthContext = createContext<AuthContextValue | null>(null);

const readStoredSession = (): Session | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
        return null;
    }
};

/*
Only the email, name and the admin flag are kept in localStorage, never the token.
The actual proof of login is the httpOnly cookie the backend sets, so if that cookie
is gone the first api call fails with 401 and the interceptor clears this.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(readStoredSession);
    const [booting, setBooting] = useState(true);

    const clearSession = useCallback(() => {
        setAuthToken(null);
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
    }, []);

    useEffect(() => {
        setSessionExpiredHandler(clearSession);
        setBooting(false);
        return () => setSessionExpiredHandler(null);
    }, [clearSession]);

    /*
    There is no /me endpoint yet, so the only way to know whether this user is an admin
    is to ask for one user and see if the call is allowed.
     */
    const checkAdmin = useCallback(async (): Promise<boolean> => {
        try {
            await fetchUsers(0, 1);
            return true;
        } catch {
            return false;
        }
    }, []);

    const saveSession = useCallback((next: Session) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setSession(next);
    }, []);

    const login = useCallback(
        async (email: string, password: string) => {
            const { token } = await signIn({ email, password });
            setAuthToken(token);

            const isAdmin = await checkAdmin();
            saveSession({ email, name: email.split('@')[0], isAdmin });
        },
        [checkAdmin, saveSession],
    );

    const register = useCallback(
        async (payload: SignUpRequest) => {
            await signUp(payload);
            const { token } = await signIn({ email: payload.email, password: payload.password });
            setAuthToken(token);

            const isAdmin = await checkAdmin();
            saveSession({ email: payload.email, name: payload.name, isAdmin });
        },
        [checkAdmin, saveSession],
    );

    const logout = useCallback(async () => {
        try {
            await signOut();
        } catch {
            // even if the call fails the local session should go away
        }
        clearSession();
    }, [clearSession]);

    const value = useMemo(
        () => ({ session, booting, login, register, logout }),
        [session, booting, login, register, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside AuthProvider');
    return context;
};
