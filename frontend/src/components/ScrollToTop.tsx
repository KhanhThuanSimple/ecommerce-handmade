import React, { useEffect, useState } from 'react';

const ScrollToTop: React.FC = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!visible) {
        return null;
    }

    return (
        <button
            className="scroll-top-button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Cuộn lên đầu trang"
        >
            <i className="fas fa-arrow-up"></i>
        </button>
    );
};

export default ScrollToTop;






