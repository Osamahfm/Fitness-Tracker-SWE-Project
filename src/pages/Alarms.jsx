import { useEffect, useState } from 'react';
import { AlarmClock, BellRing, Clock, MessageSquareText } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';

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
          <p className="eyebrow">Activity Alarm</p>
          <h3>Workout reminder</h3>
          <p className="panel-copy">Set a focused reminder for the next workout window.</p>
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
          <button type="submit"><AlarmClock size={18} /> Set Reminder</button>
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
