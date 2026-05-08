import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlarmClock, BellRing, Clock, MessageSquareText } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import { getRoleProfile, hasPermission } from '../utils/userRoles';

const alarmsPageByRole = {
  customer: {
    eyebrow: 'Activity Alarm',
    title: 'Workout reminder',
    copy: 'Set a focused reminder for the next workout window.',
    monitorEyebrow: 'Monitoring & Stabilization',
    monitorTitle: 'Active reminder',
    monitorCopy: 'Current reminder state for the daily activity flow.',
    submitLabel: 'Set Reminder'
  }
};

function defaultAlarmForm(alarm) {
  return {
    time: alarm ? alarm.time : '18:00',
    note: alarm ? alarm.note : 'Daily workout reminder'
  };
}

function getSavedAlarmDraft(alarm) {
  try {
    const saved = sessionStorage.getItem('alarmInputDraft');
    return saved ? { ...defaultAlarmForm(alarm), ...JSON.parse(saved) } : defaultAlarmForm(alarm);
  } catch {
    return defaultAlarmForm(alarm);
  }
}

export default function Alarms() {
  const { state, setAlarm, showToast } = useAppContext();
  const navigate = useNavigate();
  const role = getRoleProfile(state.profile.role).value;
  
  // Only customers can access alarms/reminders
  useEffect(() => {
    if (!hasPermission(state.profile.role, 'canSetReminders')) {
      showToast('You do not have permission to access reminders.', true);
      navigate('/');
    }
  }, [state.profile.role, navigate, showToast]);
  
  const pageCopy = alarmsPageByRole[role] || alarmsPageByRole.customer;
  
  const [formData, setFormData] = useState(() => getSavedAlarmDraft(state.alarm));

  useEffect(() => {
    sessionStorage.setItem('alarmInputDraft', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await setAlarm({ ...formData, triggered: false });
      sessionStorage.removeItem('alarmInputDraft');
      showToast("Activity reminder set!");
    } catch (error) {
      showToast(error.message, true);
    }
  };

  return (
    <section className="workspace two-column">
      <div className="panel feature-panel">
        <div className="panel-heading">
          <p className="eyebrow">{pageCopy.eyebrow}</p>
          <h3>{pageCopy.title}</h3>
          <p className="panel-copy">{pageCopy.copy}</p>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field-card">
            <span><Clock size={18} /> Reminder time</span>
            <input type="time" name="time" value={formData.time} onChange={handleChange} required />
          </label>
          <label className="field-card">
            <span><MessageSquareText size={18} /> Reminder note</span>
            <input type="text" name="note" value={formData.note} onChange={handleChange} required />
          </label>
          <button type="submit"><AlarmClock size={18} /> {pageCopy.submitLabel}</button>
        </form>
      </div>
      <div className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Monitoring & Stabilization</p>
          <h3>Active reminder</h3>
          <p className="panel-copy">Current reminder state for the daily activity flow.</p>
        </div>
        <div className={`reminder-card ${state.alarm ? (state.alarm.triggered ? 'warning' : 'ready') : ''}`}>
          <BellRing size={30} />
          <div>
            <strong>{state.alarm ? state.alarm.time : 'No reminder'}</strong>
            <span>
              {state.alarm
                ? (state.alarm.triggered ? `Triggered: ${state.alarm.note}` : state.alarm.note)
                : 'No reminder has been set.'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
