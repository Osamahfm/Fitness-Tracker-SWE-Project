import { useState } from 'react';
import { BadgeCheck, Mail, Scale, ShieldCheck, Target, UserRound } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import { getRoleProfile, roleOptions } from '../utils/userRoles';

export default function Profile() {
  const { state, updateProfile, showToast } = useAppContext();
  
  const [formData, setFormData] = useState({
    name: state.profile.name || '',
    email: state.profile.email || '',
    role: state.profile.role || 'customer',
    goal: state.profile.goal || 'Body Recompose',
    weight: state.profile.weight || 75
  });

  const roleProfile = getRoleProfile(formData.role);

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
      <div className="panel feature-panel">
        <div className="panel-heading">
          <p className="eyebrow">User Profile & Goals</p>
          <h3>Account details</h3>
          <p className="panel-copy">Keep profile details accurate for more useful calorie and goal recommendations.</p>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field-card">
            <span><UserRound size={18} /> Full name</span>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </label>
          <label className="field-card">
            <span><Mail size={18} /> Email</span>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </label>
          <label className="field-card">
            <span><ShieldCheck size={18} /> Account role</span>
            <select name="role" value={formData.role} onChange={handleChange}>
              {roleOptions.map((roleOption) => (
                <option key={roleOption.value} value={roleOption.value}>{roleOption.label}</option>
              ))}
            </select>
          </label>
          <label className="field-card">
            <span><Target size={18} /> Fitness goal</span>
            <select name="goal" value={formData.goal} onChange={handleChange}>
              <option>Body Recompose</option>
              <option>Maintain Body Weight</option>
              <option>Achieve User Goal</option>
            </select>
          </label>
          <label className="field-card">
            <span><Scale size={18} /> Body weight (kg)</span>
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
        <div className="profile-summary">
          <div className="profile-avatar">{state.profile.name?.slice(0, 2).toUpperCase() || 'FT'}</div>
          <div>
            <strong>{state.profile.name}</strong>
            <span>{state.profile.email}</span>
            <span>{roleProfile.label} - {roleProfile.description}</span>
          </div>
        </div>
        <p className="panel-copy">{state.profile.validated ? `${state.profile.name} is fully set up as a ${roleProfile.label.toLowerCase()} account.` : "Complete the account details to validate the user profile."}</p>
        <div className="checklist">
          <span><BadgeCheck size={16} /> Profile details</span>
          <span><BadgeCheck size={16} /> Account role</span>
          <span><BadgeCheck size={16} /> Fitness goals</span>
          <span><BadgeCheck size={16} /> Readiness</span>
        </div>
      </div>
    </section>
  );
}
