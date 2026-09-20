import { createContext } from 'react';

export type ToastTone = 'success' | 'error';

export interface ToastContextValue {
    notify: (message: string, tone?: ToastTone) => void;
}

// kept in its own file so the provider file only exports a component
export const ToastContext = createContext<ToastContextValue | null>(null);
