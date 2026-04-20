import React, { useState } from 'react';
import '../Styles/imageMagnifier.css';
interface Props { src: string; alt: string; }

const ImageMagnifier: React.FC<Props> = ({ src, alt }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [show, setShow] = useState(false);

    //Tính vị trí chuột theo tỉ lệ %
    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.pageX - left - window.scrollX) / width) * 100;
        const y = ((e.pageY - top - window.scrollY) / height) * 100;
        setPosition({ x, y });
    };

    return (
        <div
            className="mag-container"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
            onMouseMove={handleMove}
        >
            {/* Ảnh gốc hiển thị */}
            <img src={src} alt={alt} className="mag-original" />

            {/* Cửa sổ soi bên trái */}
            {show && (
                <div
                    className="mag-zoom-window"
                    style={{
                        backgroundImage: `url(${src})`,
                        backgroundPosition: `${position.x}% ${position.y}%`
                    }}
                />
            )}
        </div>
    );
};

export default ImageMagnifier;