import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function Reports() {
  const { state, deleteActivity, showToast } = useAppContext();

  const handleDelete = (id) => {
    deleteActivity(id);
    showToast("Activity deleted");
  };

  return (
    <section className="workspace">
      <div className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Daily Reports</p>
          <h3>Saved Activity Records</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
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
                  <td colSpan="7" style={{ textAlign: 'center' }}>No activity records saved yet.</td>
                </tr>
              ) : (
                state.activities.map((activity) => (
                  <tr key={activity.id}>
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
