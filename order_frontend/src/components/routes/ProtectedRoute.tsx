import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';

// sends anyone without a session back to login, and remembers where they wanted to go
export const ProtectedRoute = () => {
    const { session, booting } = useAuth();
    const location = useLocation();

    if (booting) return null;
    if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

    return <Outlet />;
};

// keeps a logged in user away from the login and register pages
export const PublicOnlyRoute = () => {
    const { session, booting } = useAuth();

    if (booting) return null;
    if (session) return <Navigate to="/orders" replace />;

    return <Outlet />;
};
