import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function Login() {
  const { state, updateProfile, showToast } = useAppContext();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.profile.email && state.profile.name) {
      navigate('/');
    }
  }, [state.profile, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const pass = formData.get('password');
    const name = formData.get('name') || email.split('@')[0];

    if (pass.length < 6) {
      return showToast("Password must be at least 6 characters.", true);
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      updateProfile({ name, email });
      showToast(isRegister ? "Account created successfully!" : "Logged in successfully!");
    }, 1200);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-mark">FT</div>
          <h2>{isRegister ? "Create Account" : "Welcome Back"}</h2>
          <p>{isRegister ? "Join us to track your fitness" : "Log in to access your fitness dashboard"}</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              Full Name
              <input type="text" name="name" placeholder="Enter your name" required />
            </label>
          )}
          <label>
            Email
            <input type="email" name="email" placeholder="user@example.com" required />
          </label>
          <label>
            Password
            <input type="password" name="password" placeholder="••••••••" required />
          </label>
          <button type="submit" className={`primary-btn ${loading ? 'btn-loading' : ''}`}>
            {isRegister ? "Sign Up" : "Log In"}
          </button>
        </form>
        
        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{' '}
          <button type="button" className="text-btn" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
