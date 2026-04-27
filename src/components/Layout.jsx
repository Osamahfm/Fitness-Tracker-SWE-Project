import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/useAppContext';

export default function Layout() {
  const { state, logout, showToast } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!state.profile.email || !state.profile.name) {
      navigate('/login');
    }
  }, [state.profile.email, state.profile.name, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (state.alarm && !state.alarm.triggered) {
        const now = new Date();
        const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (current === state.alarm.time) {
          showToast(`ALARM: ${state.alarm.note}`, false);
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [state.alarm, showToast]);

  if (!state.profile.email) return null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">FT</div>
          <div>
            <p className="eyebrow">Web Platform</p>
            <h1>Fitness Tracker</h1>
          </div>
        </div>

        <nav className="nav-list">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Dashboard</NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : "")}>Profile Settings</NavLink>
          <NavLink to="/activity" className={({ isActive }) => (isActive ? "active" : "")}>Activity Input</NavLink>
          <NavLink to="/reports" className={({ isActive }) => (isActive ? "active" : "")}>Daily Reports</NavLink>
          <NavLink to="/recommendations" className={({ isActive }) => (isActive ? "active" : "")}>Meals & Goals</NavLink>
          <NavLink to="/alarms" className={({ isActive }) => (isActive ? "active" : "")}>Activity Alarms</NavLink>
          <NavLink to="/readiness" className={({ isActive }) => (isActive ? "active" : "")}>System Readiness</NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Fitness Tracker System</p>
            <h2>Daily Activity Workspace</h2>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="profile-pill">
              <span className={`dot ${state.profile.validated ? 'valid' : ''}`}></span>
              <span>{state.profile.name}</span>
            </div>
            <button onClick={logout} className="text-btn" style={{ color: 'var(--text-secondary)' }}>Log Out</button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
