import { useCallback, useEffect, useState } from 'react';
import { api, clearToken, getToken, setToken } from '../api/client';
import { AppContext } from './appContextCore';

const initialState = {
  profile: {
    name: "",
    email: "",
    goal: "Body Recompose",
    weight: 75,
    validated: false
  },
  activities: [],
  alarm: null,
  uatSignoffs: [],
  health: null
};

async function fetchHealthSnapshot() {
  try {
    return await api('/health');
  } catch {
    return null;
  }
}

function clearFormDrafts() {
  sessionStorage.removeItem('activityInputDraft');
  sessionStorage.removeItem('alarmInputDraft');
}

export const AppProvider = ({ children }) => {
  const [state, setState] = useState(initialState);
  const [toasts, setToasts] = useState([]);
  const [loadingSession, setLoadingSession] = useState(Boolean(getToken()));

  const loadSession = useCallback(async () => {
    if (!getToken()) {
      setLoadingSession(false);
      return;
    }

    try {
      const data = await api('/me');
      setState((current) => ({ ...current, ...data }));
    } catch {
      clearToken();
      setState(initialState);
    } finally {
      setLoadingSession(false);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    const health = await fetchHealthSnapshot();
    setState((current) => ({ ...current, health }));
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      loadSession();
      loadHealth();
    });
  }, [loadHealth, loadSession]);

  const updateProfile = async (profileData) => {
    const data = await api('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    setState((s) => ({ ...s, profile: data.profile }));
  };

  const registerUser = async ({ name, email, password, goal, weight }) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, goal, weight })
    });
    setToken(data.token);
    clearFormDrafts();
    const health = await fetchHealthSnapshot();
    setState((s) => ({ ...s, profile: data.profile, activities: [], alarm: null, uatSignoffs: [], health }));
  };

  const loginUser = async ({ email, password }) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    clearFormDrafts();
    const [session, health] = await Promise.all([api('/me'), fetchHealthSnapshot()]);
    setState((s) => ({ ...s, ...session, health }));
  };

  const estimateCalories = useCallback(async (input) => {
    return api('/calories', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }, []);

  const addActivity = async (activity) => {
    const data = await api('/activities', {
      method: 'POST',
      body: JSON.stringify(activity)
    });
    setState((s) => ({ ...s, activities: [data.activity, ...s.activities] }));
    await loadHealth();
    return data.activity;
  };

  const deleteActivity = async (id) => {
    await api(`/activities/${id}`, { method: 'DELETE' });
    setState((s) => ({ ...s, activities: s.activities.filter((a) => a.id !== id) }));
    await loadHealth();
  };

  const setAlarm = async (alarm) => {
    const data = await api('/alarms', {
      method: 'POST',
      body: JSON.stringify(alarm)
    });
    setState((s) => ({ ...s, alarm: data.alarm }));
    await loadHealth();
  };

  const addUatSignoff = async (signoff) => {
    const data = await api('/uat-signoff', {
      method: 'POST',
      body: JSON.stringify(signoff)
    });
    setState((s) => ({ ...s, uatSignoffs: [data.signoff, ...s.uatSignoffs] }));
    return data.signoff;
  };

  const logout = () => {
    clearToken();
    clearFormDrafts();
    setState(initialState);
  };

  const showToast = useCallback((message, isError = false) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, isError }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  if (loadingSession) {
    return <div className="loading-screen">Loading Fitness Tracker...</div>;
  }

  return (
    <AppContext.Provider value={{ state, updateProfile, registerUser, loginUser, estimateCalories, addActivity, deleteActivity, setAlarm, addUatSignoff, loadHealth, logout, showToast, toasts }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast show ${toast.isError ? 'error' : ''}`}>
            <span>{toast.isError ? '!' : 'OK'}</span>
            <div>{toast.message}</div>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};
