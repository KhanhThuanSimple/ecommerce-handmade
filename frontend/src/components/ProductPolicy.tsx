// src/components/ProductPolicy.tsx
import React from 'react';
import policies from '../mock-data/policyData.json';

const ProductPolicy: React.FC = () => {
    return (
        <div className="product-single_policy">
            <div className="product-policy">
                {policies.map((policy) => (
                    <div
                        key={policy.id}
                        className="product-policy_item flex"
                    >
                        <div className="product-policy_icon">
                            <i className={policy.iconClass}></i>
                        </div>
                        <span className="product-policy_title">
                            {policy.title}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductPolicy;
