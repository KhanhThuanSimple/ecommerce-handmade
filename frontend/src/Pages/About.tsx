import React from 'react';
import { User } from '../types/model';
import { MapPin, Phone, Mail, Globe, CheckCircle2, Users, Heart, Sparkles } from 'lucide-react';
import '../Styles/about.css';

interface AboutProps {
  currentUser: User | null;
}

const About: React.FC<AboutProps> = ({ currentUser }) => {
  return (
    <div className="about-page">
      {/* HERO SECTION */}
      <section className="about-hero">
        <div className="hero-content">
          <span className="hero-badge">Since 2026</span>
          <h1>HandMade Store</h1>
          <p>Thủ công tinh tế – Giá trị bền vững – Phong cách riêng của bạn</p>
          {currentUser && (
            <div className="welcome-tag">
              Xin chào, <strong>{currentUser.username}</strong> 👋
            </div>
          )}
        </div>
      </section>

      <div className="container">
        {/* GIỚI THIỆU & TẦM NHÌN */}
        <section className="about-grid-section">
          <div className="about-card intro-card">
            <div className="icon-box"><Sparkles /></div>
            <h2>Về chúng tôi</h2>
            <p>
              HandMade Store ra đời với sứ mệnh mang đến những sản phẩm thủ công
              tinh xảo. Mỗi sản phẩm không chỉ là một món đồ, mà còn là một câu chuyện
              về sáng tạo và cảm xúc từ đôi bàn tay nghệ nhân.
            </p>
          </div>
          <div className="about-card vision-card">
            <div className="icon-box"><Heart /></div>
            <h2>Giá trị cốt lõi</h2>
            <p>
              Chúng tôi xây dựng thương hiệu dựa trên chất lượng và sự khác biệt. 
              Mọi công đoạn từ chọn nguyên liệu đến đóng gói đều được kiểm soát tỉ mỉ 
              để mang lại trải nghiệm tốt nhất.
            </p>
          </div>
        </section>

        {/* CAM KẾT - Dạng Grid Icons */}
        <section className="commitments-section">
          <h2 className="section-title">Cam kết của chúng tôi</h2>
          <div className="commitments-grid">
            {[
              "Nguyên liệu an toàn, thân thiện",
              "Sản phẩm thủ công độc bản",
              "Đóng gói cẩn thận, tinh tế",
              "Bảo hành & đổi trả rõ ràng",
              "Dịch vụ khách hàng tận tâm",
              "Giao hàng nhanh chóng"
            ].map((text, index) => (
              <div key={index} className="commit-item">
                <CheckCircle2 className="commit-icon" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ĐỘI NGŨ & LIÊN HỆ (Split Layout) */}
        <div className="bottom-grid">
          <section className="about-section team-preview">
            <h2><Users /> Đội ngũ nghệ nhân</h2>
            <p>
              Sở hữu đội ngũ lành nghề cùng xưởng sản xuất riêng, chúng tôi tự tin 
              đảm bảo tính thẩm mỹ và độ bền lâu dài trên từng đường kim mũi chỉ.
            </p>
            <div className="workshop-badge">Xưởng sản xuất tại Việt Nam</div>
          </section>

          <section className="about-section ">
            <h2>Liên hệ</h2>
            <div className="contact-list">
              <div className="contact-item">
                <MapPin size={20} />
                <span>123 Đường Handmade, TP. Sáng Tạo</span>
              </div>
              <div className="contact-item">
                <Phone size={20} />
                <span>1900 1234</span>
              </div>
              <div className="contact-item">
                <Mail size={20} />
                <span>support@handmadestore.com</span>
              </div>
              <div className="contact-item">
                <Globe size={20} />
                <span>www.handmadestore.com</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;