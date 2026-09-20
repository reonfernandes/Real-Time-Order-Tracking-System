import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './topbar.css';

export const Topbar = () => {
    const { session, logout } = useAuth();

    const initials = (session?.name ?? session?.email ?? '?').slice(0, 2).toUpperCase();

    return (
        <header className="topbar">
            <div className="topbar__spacer" />
            <div className="topbar__user">
                <span className="topbar__avatar">{initials}</span>
                <span className="topbar__details">
                    <span className="topbar__name">{session?.name}</span>
                    <span className="topbar__email">{session?.email}</span>
                </span>
                {session?.isAdmin ? <span className="topbar__badge">Admin</span> : null}
            </div>
            <button type="button" className="topbar__logout" onClick={logout} title="Sign out" aria-label="Sign out">
                <LogOut size={17} />
            </button>
        </header>
    );
};
