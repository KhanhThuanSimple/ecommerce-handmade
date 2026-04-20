import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartBadge: React.FC = () => {
    const { cartCount } = useCart();

    return (
        <Link to="/cart" className="nav-link cart-link">
            Giỏ hàng 
            {/* <i className="fas fa-shopping-cart"></i> */}
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>
    );
};

export default CartBadge;