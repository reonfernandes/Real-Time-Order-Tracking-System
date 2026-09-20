import { NavLink } from 'react-router';
import { PackageSearch, PanelLeftClose, PanelLeftOpen, Plus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './sidebar.css';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
    const { session } = useAuth();

    // users link only makes sense for an admin, the endpoint would give 403 otherwise
    const links = [
        { to: '/orders', label: 'Orders', icon: PackageSearch },
        { to: '/orders/new', label: 'New order', icon: Plus },
        ...(session?.isAdmin ? [{ to: '/users', label: 'Users', icon: Users }] : []),
    ];

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
            <div className="sidebar__brand">
                <svg className="sidebar__logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
                    <path d="M3 7l9 4 9-4" />
                    <path d="M12 11v10" />
                </svg>
                {!collapsed ? <span className="sidebar__name">OrderTrack</span> : null}
            </div>

            <nav className="sidebar__nav">
                {links.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/orders'}
                        className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                        title={collapsed ? label : undefined}
                    >
                        <Icon size={19} className="sidebar__icon" />
                        {!collapsed ? <span>{label}</span> : null}
                    </NavLink>
                ))}
            </nav>

            <button
                type="button"
                className="sidebar__toggle"
                onClick={onToggle}
                title={collapsed ? 'Expand menu' : 'Collapse menu'}
                aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
            >
                {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                {!collapsed ? <span>Collapse</span> : null}
            </button>
        </aside>
    );
};
