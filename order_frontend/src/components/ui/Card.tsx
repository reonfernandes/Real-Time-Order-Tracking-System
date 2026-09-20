import type { ReactNode } from 'react';
import './card.css';

interface CardProps {
    title?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    padded?: boolean;
}

export const Card = ({ title, action, children, className = '', padded = true }: CardProps) => (
    <section className={`card ${className}`}>
        {title || action ? (
            <header className="card__head">
                {title ? <h2 className="card__title">{title}</h2> : <span />}
                {action}
            </header>
        ) : null}
        <div className={padded ? 'card__body' : ''}>{children}</div>
    </section>
);
