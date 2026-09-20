import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, TriangleAlert, X } from 'lucide-react';
import './toast.css';

type ToastTone = 'success' | 'error';

interface Toast {
    id: number;
    tone: ToastTone;
    message: string;
}

interface ToastContextValue {
    notify: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const notify = useCallback(
        (message: string, tone: ToastTone = 'success') => {
            const id = Date.now() + Math.random();
            setToasts((current) => [...current, { id, tone, message }]);
            window.setTimeout(() => dismiss(id), 4000);
        },
        [dismiss],
    );

    const value = useMemo(() => ({ notify }), [notify]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-stack" role="status" aria-live="polite">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast--${toast.tone}`}>
                        {toast.tone === 'success' ? <CheckCircle2 size={18} /> : <TriangleAlert size={18} />}
                        <span className="toast__text">{toast.message}</span>
                        <button type="button" className="toast__close" aria-label="Dismiss" onClick={() => dismiss(toast.id)}>
                            <X size={15} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextValue => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used inside ToastProvider');
    return context;
};
