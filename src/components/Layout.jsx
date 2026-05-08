import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlarmClock,
  BarChart3,
  ClipboardCheck,
  Dumbbell,
  Home,
  LogOut,
  Salad,
  UserRound
} from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import { getRoleProfile } from '../utils/userRoles';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/activity', label: 'Workout', icon: Dumbbell },
  { to: '/reports', label: 'Analytics', icon: BarChart3 },
  { to: '/recommendations', label: 'Nutrition', icon: Salad },
  { to: '/alarms', label: 'Alarms', icon: AlarmClock },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/readiness', label: 'Readiness', icon: ClipboardCheck }
];

export default function Layout() {
  const { state, logout, showToast } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const roleProfile = getRoleProfile(state.profile.role);

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
          <div className="brand-mark"><Activity size={24} /></div>
          <div>
            <p className="eyebrow">FitFlow</p>
            <h1>Fitness Tracker</h1>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} aria-label={label} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="status-panel">
          <p className="eyebrow">Today</p>
          <div className="target">
            <span>Tracking</span>
            <strong>{state.activities.length ? 'Live' : 'Ready'}</strong>
          </div>
          <div className="target">
            <span>Goal</span>
            <strong>{state.profile.goal.replace('User ', '')}</strong>
          </div>
          <div className="target">
            <span>Role</span>
            <strong>{roleProfile.label}</strong>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Fitness Tracker</p>
            <h2>Daily Activity Workspace</h2>
          </div>
          <div className="topbar-actions">
            <div className="profile-pill">
              <span className={`dot ${state.profile.validated ? 'valid' : ''}`}></span>
              <span>{state.profile.name}</span>
            </div>
            <div className="role-badge">{roleProfile.label}</div>
            <button onClick={logout} className="icon-text-btn" type="button">
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="route-frame"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
