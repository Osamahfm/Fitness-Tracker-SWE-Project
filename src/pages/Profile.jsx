import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';

export default function Profile() {
  const { state, updateProfile, showToast } = useAppContext();
  
  const [formData, setFormData] = useState({
    name: state.profile.name || '',
    email: state.profile.email || '',
    goal: state.profile.goal || 'Body Recompose',
    weight: state.profile.weight || 75
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ ...formData, weight: Number(formData.weight), validated: true });
      showToast("Profile settings saved successfully!");
    } catch (error) {
      showToast(error.message, true);
    }
  };

  return (
    <section className="workspace two-column">
      <div className="panel">
        <div className="panel-heading">
          <p className="eyebrow">User Profile & Goals</p>
          <h3>Account Details</h3>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Full name
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </label>
          <label>
            Email
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </label>
          <label>
            Fitness goal
            <select name="goal" value={formData.goal} onChange={handleChange}>
              <option>Body Recompose</option>
              <option>Maintain Body Weight</option>
              <option>Achieve User Goal</option>
            </select>
          </label>
          <label>
            Body weight (kg)
            <input type="number" name="weight" min="30" max="250" value={formData.weight} onChange={handleChange} required />
          </label>
          <button type="submit">Save Profile</button>
        </form>
      </div>

      <div className="panel validation-panel">
        <div className="panel-heading">
          <p className="eyebrow">Validation Status</p>
          <h3>{state.profile.validated ? "Validated" : "Pending"}</h3>
        </div>
        <p>{state.profile.validated ? `${state.profile.name} is fully set up for daily physical activity records.` : "Complete the account details to validate the user profile."}</p>
        <div className="checklist">
          <span>Profile details</span>
          <span>Fitness goals</span>
          <span>Readiness</span>
        </div>
      </div>
    </section>
  );
}
