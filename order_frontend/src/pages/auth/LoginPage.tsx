import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { errorMessage } from '../../api/client';
import { useAuth } from '../../context/useAuth';
import { redirectTarget } from '../../lib/redirect';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { AuthShell } from './AuthShell';

export const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email.trim(), password);
            // back to whatever they were trying to open, /orders when they came here directly
            navigate(redirectTarget((location.state as { from?: string } | null)?.from), { replace: true });
        } catch (err) {
            setError(errorMessage(err, 'Email or password is not correct.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell>
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__head">
                    <h2 className="auth-form__title">Sign in</h2>
                    <p className="auth-form__sub">Use the account you registered with.</p>
                </div>

                {error ? <div className="auth-form__error">{error}</div> : null}

                <div className="auth-form__fields">
                    <Field
                        label="Email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                    <Field
                        label="Password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Your password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                <Button type="submit" block loading={loading}>
                    Sign in
                </Button>

                <p className="auth-form__foot">
                    No account yet? <Link to="/register">Create one</Link>
                </p>
            </form>
        </AuthShell>
    );
};
