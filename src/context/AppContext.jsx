import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const initialState = {
  profile: {
    name: "",
    email: "",
    goal: "Body Recompose",
    weight: 75,
    validated: false
  },
  activities: [],
  alarm: null
};

export const AppProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem("ft_state");
    return saved ? JSON.parse(saved) : initialState;
  });

  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    localStorage.setItem("ft_state", JSON.stringify(state));
  }, [state]);

  const updateProfile = (profileData) => {
    setState(s => ({ ...s, profile: { ...s.profile, ...profileData } }));
  };

  const addActivity = (activity) => {
    setState(s => ({ ...s, activities: [{ ...activity, id: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...s.activities] }));
  };

  const deleteActivity = (id) => {
    setState(s => ({ ...s, activities: s.activities.filter(a => a.id !== id) }));
  };

  const setAlarm = (alarm) => {
    setState(s => ({ ...s, alarm }));
  };

  const logout = () => {
    localStorage.removeItem("ft_state");
    setState(initialState);
  };

  const showToast = (message, isError = false) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, isError }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <AppContext.Provider value={{ state, updateProfile, addActivity, deleteActivity, setAlarm, logout, showToast, toasts }}>
      {children}
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast show ${toast.isError ? 'error' : ''}`}>
            <span>{toast.isError ? '⚠️' : '✅'}</span>
            <div>{toast.message}</div>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
