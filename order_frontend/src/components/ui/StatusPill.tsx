import { STATUS_META } from '../../lib/status';
import type { OrderStatus } from '../../types';
import './status-pill.css';

interface StatusPillProps {
    status: OrderStatus;
    size?: 'sm' | 'md';
}

export const StatusPill = ({ status, size = 'sm' }: StatusPillProps) => {
    const meta = STATUS_META[status];

    return (
        <span
            className={`status-pill status-pill--${size}`}
            style={{ background: meta.bg, color: meta.ink }}
            title={meta.note}
        >
            {meta.label}
        </span>
    );
};
