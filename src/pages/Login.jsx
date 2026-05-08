import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';

export default function Login() {
  const { state, registerUser, loginUser, showToast } = useAppContext();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.profile.email && state.profile.name) {
      navigate('/');
    }
  }, [state.profile, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const name = formData.get('name') || email.split('@')[0];

    if (password.length < 6) {
      return showToast("Password must be at least 6 characters.", true);
    }

    setLoading(true);
    try {
      if (isRegister) {
        await registerUser({ name, email, password });
      } else {
        await loginUser({ email, password });
      }
      showToast(isRegister ? "Account created successfully!" : "Logged in successfully!");
    } catch (error) {
      showToast(error.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-brand-panel">
        <div className="brand-mark"><Activity size={26} /></div>
        <p className="eyebrow">FitFlow</p>
        <h1>Fitness tracking that feels clear, fast, and focused.</h1>
        <div className="auth-stats">
          <span>Calories</span>
          <span>Workouts</span>
          <span>Goals</span>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <h2>{isRegister ? "Create Account" : "Welcome Back"}</h2>
          <p>{isRegister ? "Create validated access for the web fitness tracker" : "Log in to access your saved fitness records"}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              <span><UserRound size={18} /> Full Name</span>
              <input type="text" name="name" placeholder="Enter your name" required />
            </label>
          )}
          <label>
            <span><Mail size={18} /> Email</span>
            <input type="email" name="email" placeholder="user@example.com" required />
          </label>
          <label>
            <span><LockKeyhole size={18} /> Password</span>
            <input type="password" name="password" placeholder="Password" required />
          </label>
          <button type="submit" className={`primary-btn ${loading ? 'btn-loading' : ''}`}>
            <span>{isRegister ? "Sign Up" : "Log In"}</span>
            <ArrowRight size={18} />
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
