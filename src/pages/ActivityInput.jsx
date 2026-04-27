import { useEffect, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { activityFactors, effortLabels } from '../utils/fitnessMath';

export default function ActivityInput() {
  const { state, estimateCalories, addActivity, showToast } = useAppContext();

  const [formData, setFormData] = useState({
    type: 'walk',
    distance: 2.5,
    duration: 30,
    effort: '1.35'
  });
  const [calculation, setCalculation] = useState({
    calories: 0,
    validation: { checks: [], passed: false },
    formula: "Calories = MET x 3.5 x body weight x duration x effort / 200"
  });

  useEffect(() => {
    let active = true;
    estimateCalories(formData)
      .then((result) => {
        if (active) setCalculation(result);
      })
      .catch((error) => {
        if (active) showToast(error.message, true);
      });

    return () => {
      active = false;
    };
  }, [estimateCalories, formData, showToast, state.profile.weight]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!calculation.validation.passed) {
      return showToast("Please fix the calorie validation inputs first.", true);
    }

    try {
      await addActivity(formData);
      showToast("Physical activity recorded successfully!");
    } catch (error) {
      showToast(error.message, true);
    }
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
              {Object.entries(activityFactors).map(([value, activity]) => (
                <option key={value} value={value}>{activity.label}</option>
              ))}
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
              {Object.entries(effortLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <button type="submit">Save Activity</button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Backend Calories Calculation Engine</p>
          <h3>Current Estimate</h3>
        </div>
        <div className="calorie-result">
          <strong>{calculation.calories}</strong>
          <span>calories burned</span>
        </div>
        <div className="formula-box">
          <strong>Formula</strong>
          <p>{calculation.formula}</p>
        </div>
        <div className="readiness-list compact">
          {calculation.validation.checks.map((check) => (
            <div key={check.label} className={`readiness-item ${check.passed ? 'ready' : ''}`}>
              <strong>{check.passed ? "Pass" : "Fix"}</strong>
              <div>
                <h4>{check.label}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
