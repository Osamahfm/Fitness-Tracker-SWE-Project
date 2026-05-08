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

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route 
              path="profile" 
              element={
                <ProtectedRoute requiredPath="/profile">
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="activity" 
              element={
                <ProtectedRoute requiredPath="/activity">
                  <ActivityInput />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="reports" 
              element={
                <ProtectedRoute requiredPath="/reports">
                  <Reports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="recommendations" 
              element={
                <ProtectedRoute requiredPath="/recommendations">
                  <MealsAndGoals />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="alarms" 
              element={
                <ProtectedRoute requiredPath="/alarms">
                  <Alarms />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="readiness" 
              element={
                <ProtectedRoute requiredPath="/readiness">
                  <SystemReadiness />
                </ProtectedRoute>
              } 
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
