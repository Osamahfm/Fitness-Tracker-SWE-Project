import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ActivityInput from './pages/ActivityInput';
import Reports from './pages/Reports';
import MealsAndGoals from './pages/MealsAndGoals';
import Alarms from './pages/Alarms';
import Login from './pages/Login';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="activity" element={<ActivityInput />} />
            <Route path="reports" element={<Reports />} />
            <Route path="recommendations" element={<MealsAndGoals />} />
            <Route path="alarms" element={<Alarms />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
