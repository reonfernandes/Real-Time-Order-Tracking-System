import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import './auth.css';

const POINTS = [
    'Track every order through its full status flow',
    'Each status change is kept with its timestamp',
    'Confirmation mail on every step, sent over Kafka',
];

export const AuthShell = ({ children }: { children: ReactNode }) => (
    <div className="auth">
        <aside className="auth__brand">
            <div className="auth__brand-top">
                <div className="auth__logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
                        <path d="M3 7l9 4 9-4" />
                        <path d="M12 11v10" />
                    </svg>
                    <span>OrderTrack</span>
                </div>
                <h1 className="auth__headline">Watch every order move, as it moves.</h1>
                <p className="auth__lead">
                    Place an order and follow it from pending all the way to delivered, without hunting for an update.
                </p>
                <ul className="auth__points">
                    {POINTS.map((point) => (
                        <li key={point}>
                            <Check size={17} />
                            {point}
                        </li>
                    ))}
                </ul>
            </div>
            <p className="auth__stack">Spring Boot &middot; Apache Kafka &middot; MongoDB</p>
        </aside>

        <main className="auth__panel">
            <div className="auth__form-wrap">{children}</div>
        </main>
    </div>
);
