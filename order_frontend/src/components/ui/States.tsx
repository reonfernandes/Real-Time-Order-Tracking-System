import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import './states.css';

export const Spinner = ({ label = 'Loading' }: { label?: string }) => (
    <div className="state state--center" role="status">
        <Loader2 size={22} className="state__spinner" />
        <span className="state__text">{label}</span>
    </div>
);

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    message?: string;
    action?: ReactNode;
}

export const EmptyState = ({ icon, title, message, action }: EmptyStateProps) => (
    <div className="state state--center">
        {icon ? <div className="state__icon">{icon}</div> : null}
        <h3 className="state__title">{title}</h3>
        {message ? <p className="state__text">{message}</p> : null}
        {action}
    </div>
);

export const ErrorState = ({ message, action }: { message: string; action?: ReactNode }) => (
    <div className="state state--center">
        <h3 className="state__title">Could not load this</h3>
        <p className="state__text">{message}</p>
        {action}
    </div>
);
