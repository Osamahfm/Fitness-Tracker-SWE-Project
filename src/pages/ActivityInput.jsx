import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const factors = {
  walk: { label: "Walking", met: 3.5 },
  run: { label: "Running", met: 8.3 },
  cycle: { label: "Cycling", met: 6.8 },
  training: { label: "Private Training", met: 5.5 }
};

const effortLabels = {
  "1.0": "Light",
  "1.35": "Moderate",
  "1.75": "High"
};

export default function ActivityInput() {
  const { state, addActivity, showToast } = useAppContext();
  
  const [formData, setFormData] = useState({
    type: 'walk',
    distance: 2.5,
    duration: 30,
    effort: '1.35'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const estimateCalories = () => {
    const weight = Number(state.profile.weight || 75);
    const met = factors[formData.type].met;
    return Math.max(0, Math.round((met * 3.5 * weight * Number(formData.duration) * Number(formData.effort)) / 200));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addActivity({
      label: factors[formData.type].label,
      distance: Number(formData.distance),
      duration: Number(formData.duration),
      effort: effortLabels[formData.effort],
      calories: estimateCalories()
    });
    showToast("Physical activity recorded successfully!");
  };

  return (
    <section className="workspace two-column">
      <div className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Physical Activity Tracking Module</p>
          <h3>Activity Input</h3>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Activity type
            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="walk">Walking</option>
              <option value="run">Running</option>
              <option value="cycle">Cycling</option>
              <option value="training">Private Training</option>
            </select>
          </label>
          <label>
            Distance (km)
            <input type="number" name="distance" min="0" step="0.1" value={formData.distance} onChange={handleChange} required />
          </label>
          <label>
            Duration (minutes)
            <input type="number" name="duration" min="1" value={formData.duration} onChange={handleChange} required />
          </label>
          <label>
            Effort level
            <select name="effort" value={formData.effort} onChange={handleChange}>
              <option value="1.0">Light</option>
              <option value="1.35">Moderate</option>
              <option value="1.75">High</option>
            </select>
          </label>
          <button type="submit">Save Activity</button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Calories Calculation Engine</p>
          <h3>Current Estimate</h3>
        </div>
        <div className="calorie-result">
          <strong>{estimateCalories()}</strong>
          <span>calories burned</span>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>Formula uses the entered distance, duration, weight, and effort level to estimate burned calories.</p>
      </div>
    </section>
  );
}
