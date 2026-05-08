import { useEffect, useState } from 'react';
import { AlertCircle, Calculator, CheckCircle2, Dumbbell, Gauge, Route, Timer } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import { activityFactors, effortLabels } from '../utils/fitnessMath';
import { getRoleProfile } from '../utils/userRoles';

const defaultActivityForm = {
  type: 'walk',
  distance: 2.5,
  duration: 30,
  effort: '1.35'
};

const activityPageByRole = {
  customer: {
    eyebrow: 'Physical Activity Tracking Module',
    title: "Plan today's session",
    copy: 'Log the workout details your report and nutrition guidance will use.',
    engineEyebrow: 'Backend Calories Calculation Engine',
    engineTitle: 'Current estimate',
    engineCopy: 'Validated server-side before the activity is saved.',
    submitLabel: 'Save Activity'
  },
  trainer: {
    eyebrow: 'Trainer Session Builder',
    title: 'Build a coached session',
    copy: 'Record session details so client analytics and recommendations stay aligned.',
    engineEyebrow: 'Coaching Calorie Estimate',
    engineTitle: 'Session estimate',
    engineCopy: 'Use the backend result to guide safe workload decisions.',
    submitLabel: 'Save Session'
  },
  admin: {
    eyebrow: 'Activity QA Console',
    title: 'Test activity calculation',
    copy: 'Validate calorie inputs, calculation results, and saved activity records.',
    engineEyebrow: 'Backend Calories Engine',
    engineTitle: 'QA estimate',
    engineCopy: 'Server-side validation runs before the test record is saved.',
    submitLabel: 'Save QA Record'
  }
};

function getSavedActivityDraft() {
  try {
    const saved = sessionStorage.getItem('activityInputDraft');
    return saved ? { ...defaultActivityForm, ...JSON.parse(saved) } : defaultActivityForm;
  } catch {
    return defaultActivityForm;
  }
}

export default function ActivityInput() {
  const { state, estimateCalories, addActivity, showToast } = useAppContext();
  const role = getRoleProfile(state.profile.role).value;
  const pageCopy = activityPageByRole[role] || activityPageByRole.customer;

  const [formData, setFormData] = useState(getSavedActivityDraft);
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

  useEffect(() => {
    sessionStorage.setItem('activityInputDraft', JSON.stringify(formData));
  }, [formData]);

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
      sessionStorage.removeItem('activityInputDraft');
      setFormData(defaultActivityForm);
      showToast("Physical activity recorded successfully!");
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
        <form className="form-grid activity-form" onSubmit={handleSubmit}>
          <label className="field-card">
            <span><Dumbbell size={18} /> Activity type</span>
            <select name="type" value={formData.type} onChange={handleChange}>
              {Object.entries(activityFactors).map(([value, activity]) => (
                <option key={value} value={value}>{activity.label}</option>
              ))}
            </select>
          </label>
          <label className="field-card">
            <span><Route size={18} /> Distance (km)</span>
            <input type="number" name="distance" min="0" step="0.1" value={formData.distance} onChange={handleChange} required />
          </label>
          <label className="field-card">
            <span><Timer size={18} /> Duration (minutes)</span>
            <input type="number" name="duration" min="1" value={formData.duration} onChange={handleChange} required />
          </label>
          <label className="field-card">
            <span><Gauge size={18} /> Effort level</span>
            <select name="effort" value={formData.effort} onChange={handleChange}>
              {Object.entries(effortLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <button type="submit">{pageCopy.submitLabel}</button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <p className="eyebrow">{pageCopy.engineEyebrow}</p>
          <h3>{pageCopy.engineTitle}</h3>
          <p className="panel-copy">{pageCopy.engineCopy}</p>
        </div>
        <div className="calorie-result elevated-result">
          <Calculator size={26} />
          <div>
            <strong>{calculation.calories}</strong>
            <span>calories burned</span>
          </div>
        </div>
        <div className="formula-box">
          <strong>Formula</strong>
          <p>{calculation.formula}</p>
        </div>
        <div className="readiness-list compact">
          {calculation.validation.checks.map((check) => (
            <div key={check.label} className={`readiness-item ${check.passed ? 'ready' : ''}`}>
              <strong>{check.passed ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}</strong>
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
