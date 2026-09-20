import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { setAuthToken, setSessionExpiredHandler } from '../api/client';
import { fetchMe, signIn, signOut, signUp } from '../api/auth.api';
import type { SignUpRequest, UserResponse } from '../types';
import { AUTH_STORAGE_KEY, AuthContext } from './auth-context';
import type { Session } from './auth-context';

const readStoredSession = (): Session | null => {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
        return null;
    }
};

const toSession = (user: UserResponse): Session => ({
    email: user.email,
    name: user.name,
    isAdmin: user.roles.includes('ADMIN'),
});

/*
Only the email, name and the admin flag are kept in localStorage, never the token.
The real proof of login is the httpOnly cookie the backend sets, so if that cookie is
gone the first api call comes back 401 and the interceptor clears this session.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(readStoredSession);

    const clearSession = useCallback(() => {
        setAuthToken(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setSession(null);
    }, []);

    useEffect(() => {
        setSessionExpiredHandler(clearSession);
        return () => setSessionExpiredHandler(null);
    }, [clearSession]);

    const saveSession = useCallback((next: Session) => {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
        setSession(next);
    }, []);

    /*
    The stored session is only a cache, so the app can draw itself without waiting for a
    round trip. It is also localStorage, which the user can edit, and the admin flag in
    it decides which screens the ui offers. So on every load the backend is asked who
    this really is and the cache is replaced with the answer. A dead cookie answers 401
    and the interceptor clears everything.

    saveSession never changes, so this runs once on mount.
     */
    useEffect(() => {
        if (!readStoredSession()) return;

        let active = true;

        fetchMe()
            .then((user) => {
                if (active) saveSession(toSession(user));
            })
            .catch(() => {
                // 401 is already taken care of, and a backend that is simply down is not
                // a reason to sign the user out
            });

        return () => {
            active = false;
        };
    }, [saveSession]);

    const login = useCallback(
        async (email: string, password: string) => {
            const { token } = await signIn({ email, password });
            setAuthToken(token);
            saveSession(toSession(await fetchMe()));
        },
        [saveSession],
    );

    const register = useCallback(
        async (payload: SignUpRequest) => {
            await signUp(payload);
            const { token } = await signIn({ email: payload.email, password: payload.password });
            setAuthToken(token);
            saveSession(toSession(await fetchMe()));
        },
        [saveSession],
    );

    const logout = useCallback(async () => {
        try {
            await signOut();
        } catch {
            // even if the call fails the local session should go away
        }
        clearSession();
    }, [clearSession]);

    const value = useMemo(() => ({ session, login, register, logout }), [session, login, register, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
