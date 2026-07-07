import React from 'react';

export interface ReviewItemData {
    id?: number;
    userName?: string;
    rating: number;
    comment: string;
    createdAt?: string;
    images?: string[];
    avatar?: string;
}

interface ReviewItemProps {
    review: ReviewItemData;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ review }) => {
    return (
        <div className="review-item" style={{ padding: '15px 0', borderBottom: '1px solid #eee' }}>
            <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {review.avatar ? (
                        <img src={review.avatar} alt={review.userName || 'User'} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                    ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                            {review.userName ? review.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                    )}
                    <div>
                        <strong>{review.userName || 'Khách hàng'}</strong>
                        <div style={{ color: '#ffb800', fontSize: '14px' }}>
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </div>
                    </div>
                </div>
                {review.createdAt && (
                    <span className="review-date" style={{ color: '#999', fontSize: '12px' }}>
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                )}
            </div>
            <p className="review-comment" style={{ margin: '10px 0' }}>{review.comment}</p>
            {review.images && review.images.length > 0 && (
                <div className="review-images" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {review.images.map((img, idx) => (
                        <img key={idx} src={img} alt={`review-img-${idx}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewItem;
