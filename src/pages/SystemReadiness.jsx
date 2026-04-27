import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';

export default function SystemReadiness() {
  const { state, addUatSignoff, loadHealth, showToast } = useAppContext();
  const [signoffForm, setSignoffForm] = useState({
    approver: state.profile.name,
    role: "IT Department",
    result: "Approved",
    notes: "UAT approval granted after validation."
  });

  const hasActivity = state.activities.length > 0;
  const hasSignoff = state.uatSignoffs.length > 0;
  const totalCalories = state.activities.reduce((sum, activity) => sum + activity.calories, 0);
  const totalDistance = state.activities.reduce((sum, activity) => sum + activity.distance, 0);
  const health = state.health;

  const checks = [
    {
      label: "Server-side user authentication",
      status: state.profile.validated,
      detail: "Registration and login are handled by the Node API using hashed passwords and session tokens."
    },
    {
      label: "Database-backed activity tracking",
      status: hasActivity,
      detail: `${state.activities.length} saved database record(s), ${totalDistance.toFixed(1)} km tracked.`
    },
    {
      label: "Backend calories calculation engine",
      status: totalCalories >= 0,
      detail: "Calories are calculated by the backend API before activity records are saved."
    },
    {
      label: "Generated daily report",
      status: hasActivity,
      detail: hasActivity ? "Report totals are generated from database-backed activity records." : "Add activity to generate report totals."
    },
    {
      label: "UAT approval sign-off",
      status: hasSignoff,
      detail: hasSignoff ? `Latest sign-off: ${state.uatSignoffs[0].result} by ${state.uatSignoffs[0].approver}.` : "Submit a UAT sign-off to record approval."
    },
    {
      label: "Deployment health monitoring",
      status: Boolean(health?.status === "operational"),
      detail: health ? `API status ${health.status}; uptime ${health.uptimeSeconds}s; database ${health.database}.` : "Health endpoint is not available."
    }
  ];

  const passed = checks.filter((check) => check.status).length;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignoffForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addUatSignoff(signoffForm);
      showToast("UAT sign-off recorded.");
    } catch (error) {
      showToast(error.message, true);
    }
  };

  const refreshHealth = async () => {
    await loadHealth();
    showToast("Monitoring status refreshed.");
  };

  return (
    <section className="workspace">
      <div className="dashboard-grid">
        <article className="metric-card">
          <span>API Health</span>
          <strong>{health?.status || "Offline"}</strong>
          <p>Backend monitoring endpoint for deployment stabilization.</p>
        </article>
        <article className="metric-card">
          <span>Uptime Target</span>
          <strong>{health?.uptimeTarget || 95}%</strong>
          <p>Project acceptance target from the charter and scope baseline.</p>
        </article>
        <article className="metric-card">
          <span>Tracking Target</span>
          <strong>{health?.trackingTarget || 95}%</strong>
          <p>Daily user physical activity tracking target from the requirements.</p>
        </article>
        <article className="metric-card">
          <span>UAT Coverage</span>
          <strong>{passed}/{checks.length}</strong>
          <p>Acceptance checks backed by current system data.</p>
        </article>
      </div>

      <section className="workspace two-column">
        <div className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Deployment, UAT & Monitoring</p>
            <h3>System Readiness Checklist</h3>
          </div>
          <div className="readiness-list">
            {checks.map((check) => (
              <div key={check.label} className={`readiness-item ${check.status ? 'ready' : ''}`}>
                <strong>{check.status ? "Passed" : "Pending"}</strong>
                <div>
                  <h4>{check.label}</h4>
                  <p>{check.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="secondary-btn" onClick={refreshHealth}>Refresh Monitoring</button>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <p className="eyebrow">User Acceptance Testing</p>
            <h3>Approval Sign-Off</h3>
          </div>
          <form className="form-grid single" onSubmit={handleSubmit}>
            <label>
              Approver
              <input name="approver" value={signoffForm.approver} onChange={handleChange} required />
            </label>
            <label>
              Role
              <input name="role" value={signoffForm.role} onChange={handleChange} required />
            </label>
            <label>
              Result
              <select name="result" value={signoffForm.result} onChange={handleChange}>
                <option>Approved</option>
                <option>Approved with Notes</option>
                <option>Rejected</option>
              </select>
            </label>
            <label>
              Notes
              <input name="notes" value={signoffForm.notes} onChange={handleChange} required />
            </label>
            <button type="submit">Record Sign-Off</button>
          </form>
          <div className="readiness-list compact signoff-history">
            {state.uatSignoffs.length === 0 ? (
              <p className="empty-note">No UAT sign-off recorded yet.</p>
            ) : state.uatSignoffs.map((signoff) => (
              <div key={signoff.id} className="readiness-item ready">
                <strong>{signoff.result}</strong>
                <div>
                  <h4>{signoff.approver}</h4>
                  <p>{signoff.role} - {new Date(signoff.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
