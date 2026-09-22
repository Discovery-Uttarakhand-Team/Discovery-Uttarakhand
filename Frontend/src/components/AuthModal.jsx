import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthModal = () => {
  const { authModalOpen, setAuthModalOpen, login, register, authError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [validationError, setValidationError] = useState('');

  if (!authModalOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (isLogin) {
      if (!formData.email || !formData.password) {
        return setValidationError('Please fill in all fields');
      }
      await login({ email: formData.email, password: formData.password });
    } else {
      if (!formData.name || !formData.email || !formData.password) {
        return setValidationError('Please fill in all fields');
      }
      if (formData.password !== formData.confirmPassword) {
        return setValidationError('Passwords do not match');
      }
      if (formData.password.length < 6) {
        return setValidationError('Password must be at least 6 characters');
      }
      await register({ name: formData.name, email: formData.email, password: formData.password });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-warm-white rounded-2xl p-8 w-full max-w-md relative card-shadow">
        <button 
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 text-muted-text hover:text-text-dark"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold text-forest-green mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Join Discovery Uttarakhand'}
        </h2>

        {(validationError || authError) && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
            {validationError || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-forest-green"
                placeholder="Full Name"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-forest-green"
              placeholder="Email Address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-forest-green"
              placeholder="Password"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-forest-green"
                placeholder="Confirm Password"
              />
            </div>
          )}

          <button type="submit" className="w-full btn-primary py-3 rounded-xl font-bold text-white mt-4">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-text">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setValidationError(''); }}
            className="text-forest-green font-bold hover:underline"
          >
            {isLogin ? 'Register here' : 'Login here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
