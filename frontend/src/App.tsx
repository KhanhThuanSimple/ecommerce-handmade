// =======================
// 1. IMPORT LIBRARIES
// =======================
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, BrowserRouter } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css';

// =======================
// 2. IMPORT COMPONENTS (LAYOUT)
// =======================
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Wishlist from './Pages/Wishlist';

// =======================
// 3. IMPORT PAGES (CLIENT)
// =======================
import Home from './Pages/Home';
import Product from './Pages/Product';
import ProductDetail from './Pages/ProductDetail';
import Profile from './Pages/Profile';
import Login from './Pages/Login';
import Register from './Pages/Register';
import ForgotPassword from './Pages/ForgotPassword';
import Checkout from './Pages/Checkout';
import Cart from './Pages/Cart';
import OrderHistory from './Pages/OrderHistory';
import VNPayReturn from './Pages/VNPayReturn';
import About from './Pages/About';
import Chatbox from './Pages/Chatbox';
import ChatWidget from './Pages/ChatWidget';
import OrderDetail from './Pages/OrderDetail';
import LuckyWheel from './Pages/LuckyWheel';

// =======================
// 4. IMPORT ADMIN COMPONENTS
// =======================
import AdminLayout from './admin/components/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import AdminProducts from './admin/pages/Products';
import AdminOrders from './admin/pages/Orders';
import AdminUsers from './admin/pages/Users';
import AdminGames from './admin/pages/Games';
import AdminSettings from './admin/pages/Settings';

// =======================
// 5. CONTEXT / TYPES / STYLES
// =======================
import { CartProvider } from './context/CartContext';
import { User } from './types/model';
import './Styles/global.css';
import './admin/styles/admin.css';

// =======================
// 6. PROTECTED ROUTE COMPONENT
// =======================
const ProtectedRoute = ({
    children,
}: {
    children: React.ReactNode;
}) => {

    const userStr = localStorage.getItem('user');

    if (!userStr) {
        return <Navigate to="/login" replace />;
    }

    try {
        const user: User = JSON.parse(userStr);

        const roles = user.roles || [];

        // Chấp nhận cả ADMIN và ROLE_ADMIN
        const isAdmin =
            roles.includes('ROLE_ADMIN') ||
            roles.includes('ADMIN');

        if (!isAdmin) {
            return <Navigate to="/" replace />;
        }

        return <>{children}</>;

    } catch (error) {
        return <Navigate to="/login" replace />;
    }
};
// =======================
// 7. MAIN LAYOUT (CLIENT)
// =======================
const MainLayout = ({
    children,
    currentUser,
    onLogout,
}: {
    children: React.ReactNode;
    currentUser: User | null;
    onLogout: () => void;
}) => {
    return (
        <>
            <Header currentUser={currentUser} onLogout={onLogout} />
            <main style={{ minHeight: '80vh', paddingTop: '20px' }}>
                {children}
            </main>
            <Footer />
            <ScrollToTop />  
            <ChatWidget currentUser={currentUser} />
        </>
    );
};

// =======================
// 8. ADMIN ROUTES COMPONENT
// =======================
const AdminRoutes = ({ currentUser }: { currentUser: User | null }) => {
    return (
        <Routes>
         <Route path="" element={   
                <ProtectedRoute >
                    <AdminLayout>
                        <Dashboard />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="products" element={
                <ProtectedRoute >
                    <AdminLayout>
                        <AdminProducts />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="orders" element={
                <ProtectedRoute >
                    <AdminLayout>
                        <AdminOrders />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="users" element={
                <ProtectedRoute >
                    <AdminLayout>
                        <AdminUsers />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="games" element={
                <ProtectedRoute >
                    <AdminLayout>
                        <AdminGames />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="settings" element={
                <ProtectedRoute>
                    <AdminLayout>
                        <AdminSettings />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    );
};

// =======================
// 9. APP COMPONENT
// =======================
function App() {
    const navigate = useNavigate();
    const location = useLocation();

    // ----- USER STATE -----
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('user');
        try {
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
            return null;
        }
    });

    // ----- AUTH HANDLERS -----
    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        const redirectPath = location.state?.from || '/';
        navigate(redirectPath);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setCurrentUser(null);
        navigate('/login');
    };

    // ----- SCROLL TO TOP -----
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    // Kiểm tra nếu đang ở route admin thì không dùng MainLayout
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <CartProvider currentUser={currentUser}>
            <div className="App">
                <Routes>
                    {/* ===== ADMIN ROUTES (Không dùng MainLayout) ===== */}
                    <Route path="/admin/*" element={<AdminRoutes currentUser={currentUser} />} />

                    {/* ===== AUTH ROUTES ===== */}
                    <Route path="/login" element={
                        currentUser ? <Navigate to="/" /> : (
                            <div className="auth-page-wrapper">
                                <Login
                                    onLoginSuccess={handleLoginSuccess}
                                    onSwitchToRegister={() => navigate('/register')}
                                    onSwitchToForgot={() => navigate('/forgot-password')}
                                    onClose={() => navigate('/')}
                                />
                            </div>
                        )
                    } />

                    <Route path="/register" element={
                        <div className="auth-page-wrapper">
                            <Register
                                onSwitchToLogin={() => navigate('/login')}
                                onClose={() => navigate('/')}
                            />
                        </div>
                    } />

                    <Route path="/forgot-password" element={
                        <div className="auth-page-wrapper">
                            <ForgotPassword
                                onSwitchToLogin={() => navigate('/login')}
                                onClose={() => navigate('/')}
                            />
                        </div>
                    } />

                    {/* ===== MAIN CLIENT ROUTES (Sử dụng MainLayout) ===== */}
                    <Route path="/" element={
                        <MainLayout currentUser={currentUser} onLogout={handleLogout}>
                            <Home currentUser={currentUser} />
                        </MainLayout>
                    } />

                    <Route path="/products" element={
                        <MainLayout currentUser={currentUser} onLogout={handleLogout}>
                            <Product currentUser={currentUser} />
                        </MainLayout>
                    } />

                    <Route path="/profile" element={
                        <MainLayout currentUser={currentUser} onLogout={handleLogout}>
                            <Profile currentUser={currentUser} onLogout={handleLogout} />
                        </MainLayout>
                    } />

                    <Route path="/chat" element={
                        <MainLayout currentUser={currentUser} onLogout={handleLogout}>
                            <Chatbox currentUser={currentUser} />
                        </MainLayout>
                    } />

                    <Route path="/about" element={
                        <MainLayout currentUser={currentUser} onLogout={handleLogout}>
                            <About currentUser={currentUser} />
                        </MainLayout>
                    } />

                    <Route path="/products/:id" element={
                        <MainLayout currentUser={currentUser} onLogout={handleLogout}>
                            <ProductDetail currentUser={currentUser} onLogout={handleLogout} />
                        </MainLayout>
                    } />

                    <Route path="/checkout" element={
                        <MainLayout currentUser={currentUser} onLogout={handleLogout}>
                            <Checkout currentUser={currentUser} />
                        </MainLayout>
                    } />

                    <Route path="/cart" element={
                        <MainLayout currentUser={currentUser} onLogout={handleLogout}>
                            <Cart currentUser={currentUser} />
                        </MainLayout>
                    } />

                    <Route path="/orders" element={
                        <MainLayout currentUser={currentUser} onLogout={handleLogout}>
                            <OrderHistory currentUser={currentUser} />
                        </MainLayout>
                    } />

                    <Route path="/wishlist" element={
                        <MainLayout currentUser={currentUser} onLogout={handleLogout}>
                            <Wishlist />
                        </MainLayout>
                    } />

                    <Route path="/games" element={
                        <MainLayout currentUser={currentUser} onLogout={handleLogout}>
                            <LuckyWheel currentUser={currentUser} onLogout={handleLogout} />
                        </MainLayout>
                    } />

                    <Route path="/vnpay-return" element={<VNPayReturn />} />
                    
                    <Route path="/order-detail/:id" element={
                        <MainLayout currentUser={currentUser} onLogout={handleLogout}>
                            <OrderDetail />
                        </MainLayout>
                    } />

                    {/* Route 404 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </CartProvider>
    );
}

export default App;