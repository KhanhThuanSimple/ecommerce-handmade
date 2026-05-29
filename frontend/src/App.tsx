// =======================
// 1. IMPORT LIBRARIES
// =======================
import React, { useState, useEffect } from 'react';
import {
    Routes,
    Route,
    useNavigate,
    useLocation,
    Navigate,
} from 'react-router-dom';

import '@fortawesome/fontawesome-free/css/all.min.css';

// =======================
// 2. IMPORT COMPONENTS (LAYOUT)
// =======================
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

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
import Wishlist from './Pages/Wishlist';
import LuckyWheel from './Pages/LuckyWheel';

// =======================
// 4. IMPORT ADMIN PAGES
// =======================
import AdminLayout from './admin/layouts/AdminLayout';

import Dashboard from './admin/pages/Dashboard';
import Products from './admin/pages/Products';
import Users from './admin/pages/Users';
import Games from './admin/pages/Games';
import Orders from './admin/pages/Orders';
import Analytics from './admin/pages/Analytics';
import Promotions from './admin/pages/Promotions';
import Settings from './admin/pages/Settings';

// =======================
// 5. CONTEXT / TYPES / STYLES
// =======================
import { CartProvider } from './context/CartContext';
import { User } from './types/model';

import './Styles/global.css';
import './admin/styles/index.css';

// =======================
// 6. PROTECTED ROUTE
// =======================
interface ProtectedRouteProps {
    children: React.ReactNode;
    currentUser: User | null;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    currentUser,
}) => {
    // Chưa login
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Kiểm tra role admin
    const roles = currentUser.roles || [];

    const isAdmin =
        roles.includes('ROLE_ADMIN') ||
        roles.includes('ADMIN');

    // Không phải admin
    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

// =======================
// 7. MAIN LAYOUT
// =======================
interface MainLayoutProps {
    children: React.ReactNode;
    currentUser: User | null;
    onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
    children,
    currentUser,
    onLogout,
}) => {
    return (
        <>
            <Header
                currentUser={currentUser}
                onLogout={onLogout}
            />

            <main
                style={{
                    minHeight: '80vh',
                    paddingTop: '20px',
                }}
            >
                {children}
            </main>

            <Footer />

            <ScrollToTop />

            <ChatWidget currentUser={currentUser} />
        </>
    );
};

// =======================
// 8. APP COMPONENT
// =======================
function App() {
    const navigate = useNavigate();
    const location = useLocation();

    // =======================
    // USER STATE
    // =======================
    const [currentUser, setCurrentUser] =
        useState<User | null>(() => {
            const storedUser =
                localStorage.getItem('user');

            try {
                return storedUser
                    ? JSON.parse(storedUser)
                    : null;
            } catch (error) {
                console.error(
                    'Parse user error:',
                    error
                );
                return null;
            }
        });

    // =======================
    // LOGIN SUCCESS
    // =======================
    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);

        localStorage.setItem(
            'user',
            JSON.stringify(user)
        );

        const redirectPath =
            (location.state as any)?.from || '/';

        navigate(redirectPath);
    };

    // =======================
    // LOGOUT
    // =======================
    const handleLogout = () => {
        localStorage.removeItem('user');

        setCurrentUser(null);

        navigate('/login');
    };

    // =======================
    // SCROLL TO TOP
    // =======================
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    return (
        <CartProvider currentUser={currentUser}>
            <div className="App">
                <Routes>

                    {/* =======================
                        ADMIN ROUTES
                    ======================= */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute
                                currentUser={currentUser}
                            >
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route
                            index
                            element={<Dashboard />}
                        />

                        <Route
                            path="products"
                            element={<Products />}
                        />

                        <Route
                            path="users"
                            element={<Users />}
                        />

                        <Route
                            path="games"
                            element={<Games />}
                        />

                        <Route
                            path="orders"
                            element={<Orders />}
                        />

                        <Route
                            path="analytics"
                            element={<Analytics />}
                        />

                        <Route
                            path="promotions"
                            element={<Promotions />}
                        />

                        <Route
                            path="settings"
                            element={<Settings />}
                        />
                    </Route>

                    {/* =======================
                        LOGIN
                    ======================= */}
                    <Route
                        path="/login"
                        element={
                            currentUser ? (
                                <Navigate to="/" />
                            ) : (
                                <div className="auth-page-wrapper">
                                    <Login
                                        onLoginSuccess={
                                            handleLoginSuccess
                                        }
                                        onSwitchToRegister={() =>
                                            navigate('/register')
                                        }
                                        onSwitchToForgot={() =>
                                            navigate(
                                                '/forgot-password'
                                            )
                                        }
                                        onClose={() =>
                                            navigate('/')
                                        }
                                    />
                                </div>
                            )
                        }
                    />

                    {/* =======================
                        REGISTER
                    ======================= */}
                    <Route
                        path="/register"
                        element={
                            <div className="auth-page-wrapper">
                                <Register
                                    onSwitchToLogin={() =>
                                        navigate('/login')
                                    }
                                    onClose={() =>
                                        navigate('/')
                                    }
                                />
                            </div>
                        }
                    />

                    {/* =======================
                        FORGOT PASSWORD
                    ======================= */}
                    <Route
                        path="/forgot-password"
                        element={
                            <div className="auth-page-wrapper">
                                <ForgotPassword
                                    onSwitchToLogin={() =>
                                        navigate('/login')
                                    }
                                    onClose={() =>
                                        navigate('/')
                                    }
                                />
                            </div>
                        }
                    />

                    {/* =======================
                        HOME
                    ======================= */}
                    <Route
                        path="/"
                        element={
                            <MainLayout
                                currentUser={currentUser}
                                onLogout={handleLogout}
                            >
                                <Home
                                    currentUser={currentUser}
                                />
                            </MainLayout>
                        }
                    />

                    {/* =======================
                        PRODUCTS
                    ======================= */}
                    <Route
                        path="/products"
                        element={
                            <MainLayout
                                currentUser={currentUser}
                                onLogout={handleLogout}
                            >
                                <Product
                                    currentUser={currentUser}
                                />
                            </MainLayout>
                        }
                    />

                    {/* =======================
                        PRODUCT DETAIL
                    ======================= */}
                    <Route
                        path="/products/:id"
                        element={
                            <MainLayout
                                currentUser={currentUser}
                                onLogout={handleLogout}
                            >
                                <ProductDetail
                                    currentUser={currentUser}
                                    onLogout={handleLogout}
                                />
                            </MainLayout>
                        }
                    />

                    {/* =======================
                        PROFILE
                    ======================= */}
                    <Route
                        path="/profile"
                        element={
                            <MainLayout
                                currentUser={currentUser}
                                onLogout={handleLogout}
                            >
                                <Profile
                                    currentUser={currentUser}
                                    onLogout={handleLogout}
                                />
                            </MainLayout>
                        }
                    />

                    {/* =======================
                        CHAT
                    ======================= */}
                    <Route
                        path="/chat"
                        element={
                            <MainLayout
                                currentUser={currentUser}
                                onLogout={handleLogout}
                            >
                                <Chatbox
                                    currentUser={currentUser}
                                />
                            </MainLayout>
                        }
                    />

                    {/* =======================
                        ABOUT
                    ======================= */}
                    <Route
                        path="/about"
                        element={
                            <MainLayout
                                currentUser={currentUser}
                                onLogout={handleLogout}
                            >
                                <About
                                    currentUser={currentUser}
                                />
                            </MainLayout>
                        }
                    />

                    {/* =======================
                        CHECKOUT
                    ======================= */}
                    <Route
                        path="/checkout"
                        element={
                            <MainLayout
                                currentUser={currentUser}
                                onLogout={handleLogout}
                            >
                                <Checkout
                                    currentUser={currentUser}
                                />
                            </MainLayout>
                        }
                    />

                    {/* =======================
                        CART
                    ======================= */}
                    <Route
                        path="/cart"
                        element={
                            <MainLayout
                                currentUser={currentUser}
                                onLogout={handleLogout}
                            >
                                <Cart
                                    currentUser={currentUser}
                                />
                            </MainLayout>
                        }
                    />

                    {/* =======================
                        ORDERS
                    ======================= */}
                    <Route
                        path="/orders"
                        element={
                            <MainLayout
                                currentUser={currentUser}
                                onLogout={handleLogout}
                            >
                                <OrderHistory
                                    currentUser={currentUser}
                                />
                            </MainLayout>
                        }
                    />

                    {/* =======================
                        ORDER DETAIL
                    ======================= */}
                    <Route
                        path="/order-detail/:id"
                        element={
                            <MainLayout
                                currentUser={currentUser}
                                onLogout={handleLogout}
                            >
                                <OrderDetail />
                            </MainLayout>
                        }
                    />

                    {/* =======================
                        WISHLIST
                    ======================= */}
                    <Route
                        path="/wishlist"
                        element={
                            <MainLayout
                                currentUser={currentUser}
                                onLogout={handleLogout}
                            >
                                <Wishlist />
                            </MainLayout>
                        }
                    />

                    {/* =======================
                        GAMES
                    ======================= */}
                    <Route
                        path="/games"
                        element={
                            <MainLayout
                                currentUser={currentUser}
                                onLogout={handleLogout}
                            >
                                <LuckyWheel
                                    currentUser={currentUser}
                                    onLogout={handleLogout}
                                />
                            </MainLayout>
                        }
                    />

                    {/* =======================
                        VNPAY
                    ======================= */}
                    <Route
                        path="/vnpay-return"
                        element={<VNPayReturn />}
                    />

                    {/* =======================
                        404
                    ======================= */}
                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/"
                                replace
                            />
                        }
                    />
                </Routes>
            </div>
        </CartProvider>
    );
}

export default App;