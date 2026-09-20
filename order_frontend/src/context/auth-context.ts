import { createContext } from 'react';
import type { SignUpRequest } from '../types';

export interface Session {
    email: string;
    name: string;
    isAdmin: boolean;
}

export interface AuthContextValue {
    session: Session | null;
    login: (email: string, password: string) => Promise<void>;
    register: (payload: SignUpRequest) => Promise<void>;
    logout: () => Promise<void>;
}

// kept in its own file so the provider file only exports a component
export const AuthContext = createContext<AuthContextValue | null>(null);
export const AUTH_STORAGE_KEY = 'ordertrack.session';
