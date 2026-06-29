// src/utils/envChecker.js
export const checkEnvironment = () => {
  console.log('🚀 Environment Variables:');
  console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
  console.log('REACT_APP_FRONTEND_URL:', process.env.REACT_APP_FRONTEND_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Kiểm tra kết nối
  fetch(`${process.env.REACT_APP_API_URL}/products`)
    .then(res => res.json())
    .then(data => console.log('✅ API connected:', data))
    .catch(err => console.error('❌ API error:', err));
};
