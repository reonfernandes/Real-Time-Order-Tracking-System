import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import './field.css';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    hint?: string;
    error?: string;
}

export const Field = ({ label, hint, error, id, className = '', ...rest }: FieldProps) => {
    const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <div className="field">
            <label className="field__label" htmlFor={fieldId}>
                {label}
            </label>
            <input id={fieldId} className={`field__input ${error ? 'field__input--error' : ''} ${className}`} {...rest} />
            {error ? <span className="field__error">{error}</span> : null}
            {!error && hint ? <span className="field__hint">{hint}</span> : null}
        </div>
    );
};

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    hint?: string;
}

export const TextAreaField = ({ label, hint, id, ...rest }: TextAreaFieldProps) => {
    const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <div className="field">
            <label className="field__label" htmlFor={fieldId}>
                {label}
            </label>
            <textarea id={fieldId} className="field__input field__input--area" {...rest} />
            {hint ? <span className="field__hint">{hint}</span> : null}
        </div>
    );
};
