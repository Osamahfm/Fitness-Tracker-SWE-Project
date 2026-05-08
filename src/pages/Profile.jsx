import { useState } from 'react';
import { BadgeCheck, Mail, Scale, Target, UserRound } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import { getRoleProfile, getRoleInterface } from '../utils/userRoles';

const profilePageByRole = {
  customer: {
    eyebrow: 'User Profile & Goals',
    title: 'Account details',
    copy: 'Keep profile details accurate for more useful calorie and goal recommendations.',
    canChangeGoal: true,
    canChangeWeight: true,
    sections: {
      goal: 'Your fitness goal guides daily calorie targets and recommendations.',
      weight: 'Body weight is the primary input for calorie calculation accuracy.'
    }
  },
  trainer: {
    eyebrow: 'Trainer Profile & Credentials',
    title: 'Coaching account',
    copy: 'Maintain accurate profile details for client trust and coaching effectiveness.',
    canChangeGoal: false,
    canChangeWeight: true,
    sections: {
      weight: 'Personal weight reference for coaching methodology.'
    }
  },
  admin: {
    eyebrow: 'Admin Account & System Access',
    title: 'System administrator',
    copy: 'Manage system configuration and access levels for this developer account.',
    canChangeGoal: false,
    canChangeWeight: false,
    sections: {}
  }
};

export default function Profile() {
  const { state, updateProfile, showToast } = useAppContext();
  
  const [formData, setFormData] = useState({
    name: state.profile.name || '',
    email: state.profile.email || '',
    goal: state.profile.goal || 'Body Recompose',
    weight: state.profile.weight || 75
  });

  const roleProfile = getRoleProfile(state.profile.role);
  const roleInterface = getRoleInterface(state.profile.role);
  const profileCopy = profilePageByRole[state.profile.role] || profilePageByRole.customer;

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
          <p className="eyebrow">{profileCopy.eyebrow}</p>
          <h3>{profileCopy.title}</h3>
          <p className="panel-copy">{profileCopy.copy}</p>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field-card">
            <span><UserRound size={18} /> Full name</span>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </label>
          <label className="field-card">
            <span><Mail size={18} /> Email</span>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled />
          </label>
          {profileCopy.canChangeGoal && (
            <label className="field-card">
              <span><Target size={18} /> Fitness goal</span>
              <select name="goal" value={formData.goal} onChange={handleChange}>
                <option>Body Recompose</option>
                <option>Maintain Body Weight</option>
                <option>Achieve User Goal</option>
              </select>
              {profileCopy.sections.goal && (
                <small>{profileCopy.sections.goal}</small>
              )}
            </label>
          )}
          {profileCopy.canChangeWeight && (
            <label className="field-card">
              <span><Scale size={18} /> Body weight (kg)</span>
              <input type="number" name="weight" min="30" max="250" value={formData.weight} onChange={handleChange} required />
              {profileCopy.sections.weight && (
                <small>{profileCopy.sections.weight}</small>
              )}
            </label>
          )}
          <button type="submit">Save Profile</button>
        </form>
      </div>

      <div className="panel validation-panel">
        <div className="panel-heading">
          <p className="eyebrow">Account Status</p>
          <h3>{state.profile.validated ? "Validated" : "Pending"}</h3>
        </div>
        <div className="profile-summary">
          <div className="profile-avatar" style={{ backgroundColor: roleProfile.color }}>{state.profile.name?.slice(0, 2).toUpperCase() || 'FT'}</div>
          <div>
            <strong>{state.profile.name}</strong>
            <span>{state.profile.email}</span>
            <span>{roleProfile.label} - {roleProfile.description}</span>
          </div>
        </div>
        <p className="panel-copy">{state.profile.validated ? `${state.profile.name} is fully set up as a ${roleProfile.label.toLowerCase()} account with access to the ${roleInterface.workspaceTitle}.` : "Complete the account details to validate the user profile."}</p>
        <div className="checklist">
          <span><BadgeCheck size={16} /> Profile details</span>
          <span><BadgeCheck size={16} /> Account role</span>
          {profileCopy.canChangeGoal && <span><BadgeCheck size={16} /> Fitness goals</span>}
          <span><BadgeCheck size={16} /> Readiness</span>
        </div>
      </div>
    </section>
  );
}
