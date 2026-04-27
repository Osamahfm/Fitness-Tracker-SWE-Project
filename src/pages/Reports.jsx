import { useAppContext } from '../context/useAppContext';

export default function Reports() {
  const { state, deleteActivity, showToast } = useAppContext();

  const totalCalories = state.activities.reduce((sum, activity) => sum + activity.calories, 0);
  const totalDistance = state.activities.reduce((sum, activity) => sum + activity.distance, 0);
  const totalDuration = state.activities.reduce((sum, activity) => sum + activity.duration, 0);
  const latestDate = state.activities[0]?.date || new Date().toLocaleDateString();

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
          <span>Report Date</span>
          <strong>{latestDate}</strong>
          <p>Daily report generated from saved user records.</p>
        </article>
        <article className="metric-card">
          <span>Total Distance</span>
          <strong>{totalDistance.toFixed(1)} km</strong>
          <p>Distance from manual activity entries.</p>
        </article>
        <article className="metric-card">
          <span>Total Duration</span>
          <strong>{totalDuration} min</strong>
          <p>Workout time recorded today.</p>
        </article>
        <article className="metric-card">
          <span>Total Calories</span>
          <strong>{totalCalories}</strong>
          <p>Calculated burned calories for the report.</p>
        </article>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Daily Reports</p>
          <h3>Saved Activity Records</h3>
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
                  <td colSpan="8" style={{ textAlign: 'center' }}>No activity records saved yet.</td>
                </tr>
              ) : (
                state.activities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.date || latestDate}</td>
                    <td>{activity.time || '-'}</td>
                    <td>{activity.label}</td>
                    <td>{activity.distance.toFixed(1)} km</td>
                    <td>{activity.duration} min</td>
                    <td>{activity.effort}</td>
                    <td>{activity.calories}</td>
                    <td>
                      <button
                        className="text-btn"
                        style={{ color: 'var(--danger)', padding: 0 }}
                        onClick={() => handleDelete(activity.id)}
                      >
                        Delete
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
