import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function Alarms() {
  const { state, setAlarm, showToast } = useAppContext();
  
  const [formData, setFormData] = useState({
    time: state.alarm ? state.alarm.time : '18:00',
    note: state.alarm ? state.alarm.note : 'Daily workout reminder'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAlarm({ ...formData, triggered: false });
    showToast("Activity reminder set!");
  };

  return (
    <section className="workspace two-column">
      <div className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Activity Alarm</p>
          <h3>Workout Reminder</h3>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Reminder time
            <input type="time" name="time" value={formData.time} onChange={handleChange} required />
          </label>
          <label>
            Reminder note
            <input type="text" name="note" value={formData.note} onChange={handleChange} required />
          </label>
          <button type="submit">Set Reminder</button>
        </form>
      </div>
      <div className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Monitoring & Stabilization</p>
          <h3>Active Reminder</h3>
        </div>
        <div className={`recommendation-box ${state.alarm ? (state.alarm.triggered ? '' : 'ready') : ''}`}>
          {state.alarm 
            ? (state.alarm.triggered 
                ? `Alarm triggered for ${state.alarm.time}: ${state.alarm.note}`
                : `Reminder set for ${state.alarm.time}: ${state.alarm.note}`)
            : "No reminder has been set."}
        </div>
      </div>
    </section>
  );
}
