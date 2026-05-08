import { useAppContext } from '../context/useAppContext';
import { CalendarDays, Flame, Footprints, Trash2, Timer } from 'lucide-react';
import { getUserActivityMetrics } from '../utils/userMetrics';

export default function Reports() {
  const { state, deleteActivity, showToast } = useAppContext();

  const metrics = getUserActivityMetrics(state.activities);
  const latestDate = metrics.latestActivity?.date || new Date().toLocaleDateString();

  const handleDelete = async (id) => {
    try {
      await deleteActivity(id);
      showToast("Activity deleted");
    } catch (error) {
      showToast(error.message, true);
    }
  };

  return (
    <section className="workspace">
      <div className="dashboard-grid">
        <article className="metric-card">
          <span><CalendarDays size={18} /> Report Date</span>
          <strong>{latestDate}</strong>
          <p>Daily report generated from saved user records.</p>
        </article>
        <article className="metric-card">
          <span><Footprints size={18} /> Total Distance</span>
          <strong>{metrics.total.distance.toFixed(1)} km</strong>
          <p>Distance from this user's manual activity entries.</p>
        </article>
        <article className="metric-card">
          <span><Timer size={18} /> Total Duration</span>
          <strong>{metrics.total.duration} min</strong>
          <p>All saved workout minutes for the current user.</p>
        </article>
        <article className="metric-card accent-card">
          <span><Flame size={18} /> Total Calories</span>
          <strong>{metrics.total.calories}</strong>
          <p>Calculated burned calories for the report.</p>
        </article>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Daily Reports</p>
          <h3>Saved Activity Records</h3>
          <p className="panel-copy">Review, audit, and clean up the activity history used by your dashboard.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Activity</th>
                <th>Distance</th>
                <th>Duration</th>
                <th>Effort</th>
                <th>Calories</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {state.activities.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">No activity records saved yet.</div>
                  </td>
                </tr>
              ) : (
                state.activities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.date || latestDate}</td>
                    <td>{activity.time || '-'}</td>
                    <td>{activity.label}</td>
                    <td>{activity.distance.toFixed(1)} km</td>
                    <td>{activity.duration} min</td>
                    <td><span className="status-badge">{activity.effort}</span></td>
                    <td><strong>{activity.calories}</strong></td>
                    <td>
                      <button
                        className="danger-action"
                        onClick={() => handleDelete(activity.id)}
                        type="button"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
