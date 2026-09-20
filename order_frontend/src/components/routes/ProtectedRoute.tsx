import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/useAuth';
import { fullPath, redirectTarget } from '../../lib/redirect';

// sends anyone without a session back to login, and remembers where they wanted to go
export const ProtectedRoute = () => {
    const { session } = useAuth();
    const location = useLocation();

    if (!session) return <Navigate to="/login" state={{ from: fullPath(location) }} replace />;

    return <Outlet />;
};

/*
Keeps a logged in user away from the login and register pages. If they were sent here
from a protected url, they go back to that url instead of always landing on /orders.
 */
export const PublicOnlyRoute = () => {
    const { session } = useAuth();
    const location = useLocation();

    if (session) {
        return <Navigate to={redirectTarget((location.state as { from?: string } | null)?.from)} replace />;
    }

    return <Outlet />;
};

/*
The users screen only exists for an admin. The sidebar already hides the link, but the
url can still be typed, and the admin flag lives in localStorage where anybody can flip
it, so the route has to check as well. The backend is the real gate, this only keeps a
normal user from staring at a 403 screen.
 */
export const AdminRoute = () => {
    const { session } = useAuth();

    if (!session?.isAdmin) return <Navigate to="/orders" replace />;

    return <Outlet />;
};
