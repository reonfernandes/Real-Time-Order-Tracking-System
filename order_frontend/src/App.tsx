import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider } from './context/AuthProvider';
import { ToastProvider } from './context/ToastProvider';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/routes/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { NewOrderPage } from './pages/orders/NewOrderPage';
import { OrderDetailPage } from './pages/orders/OrderDetailPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';

const App = () => (
    <BrowserRouter>
        <ToastProvider>
            <AuthProvider>
                <Routes>
                    <Route element={<PublicOnlyRoute />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                    </Route>

                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route path="/orders" element={<OrdersPage />} />
                            <Route path="/orders/new" element={<NewOrderPage />} />
                            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
                            <Route path="/users" element={<AdminUsersPage />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/orders" replace />} />
                </Routes>
            </AuthProvider>
        </ToastProvider>
    </BrowserRouter>
);

export default App;
