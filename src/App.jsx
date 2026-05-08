import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ActivityInput from './pages/ActivityInput';
import Reports from './pages/Reports';
import MealsAndGoals from './pages/MealsAndGoals';
import Alarms from './pages/Alarms';
import Login from './pages/Login';
import SystemReadiness from './pages/SystemReadiness';
import { getRoleHomePath } from './utils/userRoles';
import { useAppContext } from './context/useAppContext';

function RootRedirect() {
  const { state } = useAppContext();
  if (!state.profile.email) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHomePath(state.profile.role)} replace />;
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          {/* CUSTOMER ROUTES */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<ProtectedRoute requiredPath="/customer/dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="workout" element={<ProtectedRoute requiredPath="/customer/workout"><ActivityInput /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute requiredPath="/customer/reports"><Reports /></ProtectedRoute>} />
            <Route path="nutrition" element={<ProtectedRoute requiredPath="/customer/nutrition"><MealsAndGoals /></ProtectedRoute>} />
            <Route path="alarms" element={<ProtectedRoute requiredPath="/customer/alarms"><Alarms /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute requiredPath="/customer/profile"><Profile /></ProtectedRoute>} />
          </Route>

          {/* TRAINER ROUTES */}
          <Route
            path="/trainer"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="hub" element={<ProtectedRoute requiredPath="/trainer/hub"><Dashboard /></ProtectedRoute>} />
            <Route path="session-builder" element={<ProtectedRoute requiredPath="/trainer/session-builder"><ActivityInput /></ProtectedRoute>} />
            <Route path="client-analytics" element={<ProtectedRoute requiredPath="/trainer/client-analytics"><Reports /></ProtectedRoute>} />
            <Route path="meal-plans" element={<ProtectedRoute requiredPath="/trainer/meal-plans"><MealsAndGoals /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute requiredPath="/trainer/profile"><Profile /></ProtectedRoute>} />
          </Route>

          {/* ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="system-hub" element={<ProtectedRoute requiredPath="/admin/system-hub"><Dashboard /></ProtectedRoute>} />
            <Route path="activity-qa" element={<ProtectedRoute requiredPath="/admin/activity-qa"><ActivityInput /></ProtectedRoute>} />
            <Route path="data-reports" element={<ProtectedRoute requiredPath="/admin/data-reports"><Reports /></ProtectedRoute>} />
            <Route path="readiness" element={<ProtectedRoute requiredPath="/admin/readiness"><SystemReadiness /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute requiredPath="/admin/profile"><Profile /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
