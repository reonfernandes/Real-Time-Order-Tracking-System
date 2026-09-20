import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { errorMessage } from '../../api/client';
import { useAuth } from '../../context/useAuth';
import { useToast } from '../../context/useToast';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { AuthShell } from './AuthShell';

export const RegisterPage = () => {
    const { register } = useAuth();
    const { notify } = useToast();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const update = (key: keyof typeof form) => (event: { target: { value: string } }) =>
        setForm((current) => ({ ...current, [key]: event.target.value }));

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
            notify('Account created, welcome in.');
            navigate('/orders', { replace: true });
        } catch (err) {
            setError(errorMessage(err, 'Could not create the account.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell>
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__head">
                    <h2 className="auth-form__title">Create account</h2>
                    <p className="auth-form__sub">It takes a minute, then you can place your first order.</p>
                </div>

                {error ? <div className="auth-form__error">{error}</div> : null}

                <div className="auth-form__fields">
                    <Field
                        label="Name"
                        autoComplete="name"
                        placeholder="Reon Fernandes"
                        value={form.name}
                        onChange={update('name')}
                        required
                    />
                    <Field
                        label="Email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={update('email')}
                        required
                    />
                    <Field
                        label="Password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        hint="Between 8 and 16 characters."
                        value={form.password}
                        onChange={update('password')}
                        minLength={8}
                        maxLength={16}
                        required
                    />
                </div>

                <Button type="submit" block loading={loading}>
                    Create account
                </Button>

                <p className="auth-form__foot">
                    Already registered? <Link to="/login">Sign in</Link>
                </p>
            </form>
        </AuthShell>
    );
};
