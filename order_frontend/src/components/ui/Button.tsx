import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import './button.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    loading?: boolean;
    icon?: ReactNode;
    block?: boolean;
}

export const Button = ({
    variant = 'primary',
    loading = false,
    icon,
    block = false,
    children,
    className = '',
    disabled,
    ...rest
}: ButtonProps) => (
    <button
        className={`btn btn--${variant} ${block ? 'btn--block' : ''} ${className}`}
        disabled={disabled || loading}
        {...rest}
    >
        {loading ? <Loader2 size={16} className="btn__spinner" /> : icon}
        {children}
    </button>
);
