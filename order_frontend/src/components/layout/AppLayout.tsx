import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import './app-layout.css';

const STORAGE_KEY = 'ordertrack.sidebar.collapsed';

export const AppLayout = () => {
    // collapsed by default, the choice is remembered once the user changes it
    const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem(STORAGE_KEY) !== 'false');

    const toggle = () => {
        setCollapsed((current) => {
            localStorage.setItem(STORAGE_KEY, String(!current));
            return !current;
        });
    };

    return (
        <div className="app-layout">
            <Sidebar collapsed={collapsed} onToggle={toggle} />
            <div className="app-layout__main">
                <Topbar />
                <main className="app-layout__content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
