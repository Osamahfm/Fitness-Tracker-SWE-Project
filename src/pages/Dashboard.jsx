import { useAppContext } from '../context/useAppContext';
import { Activity, Flame, Footprints, Target, Timer } from 'lucide-react';

export default function Dashboard() {
  const { state } = useAppContext();

  const totalCalories = state.activities.reduce((sum, activity) => sum + activity.calories, 0);
  const totalDistance = state.activities.reduce((sum, activity) => sum + activity.distance, 0);
  const totalDuration = state.activities.reduce((sum, activity) => sum + activity.duration, 0);
  const progress = Math.min(Math.round((totalCalories / 650) * 100), 100);
  const latestActivity = state.activities[0];

  return (
    <section className="home-screen">
      <div className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Hello, {state.profile.name}</p>
          <h3>Ready for your next move?</h3>
          <p>Track workouts, calories, meals, and reminders from one focused dashboard.</p>
        </div>
        <div className="activity-ring" style={{ '--progress': `${progress * 3.6}deg` }}>
          <div>
            <strong>{progress}%</strong>
            <span>daily burn</span>
          </div>
        </div>
      </div>

      <section className="dashboard-grid">
        <article className="metric-card accent-card">
          <span><Flame size={18} /> Calories Burned</span>
          <strong>{totalCalories}</strong>
          <p>Calculated from physical activity distance, duration, and intensity.</p>
        </article>
        <article className="metric-card">
          <span><Footprints size={18} /> Distance</span>
          <strong>{totalDistance.toFixed(1)} km</strong>
          <p>Manual activity input, as defined by the project assumptions.</p>
        </article>
        <article className="metric-card">
          <span><Timer size={18} /> Active Time</span>
          <strong>{totalDuration} min</strong>
          <p>Total workout time recorded across your saved activity records.</p>
        </article>
        <article className="metric-card">
          <span><Target size={18} /> Current Goal</span>
          <strong>{state.profile.goal.replace('User ', '')}</strong>
          <p>Recommendations update from profile and activity data.</p>
        </article>
      </section>

      <section className="workspace two-column">
        <div className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Workout Overview</p>
            <h3>Weekly Activity</h3>
          </div>
          <div className="bar-chart" aria-label="Weekly activity chart">
            {[54, 72, 38, 88, 64, 96, Math.max(progress, 22)].map((height, index) => (
              <span key={index} style={{ '--height': `${height}%` }}></span>
            ))}
          </div>
        </div>

        <div className="panel focus-panel">
          <div className="panel-heading">
            <p className="eyebrow">Latest Session</p>
            <h3>{latestActivity?.label || 'No activity yet'}</h3>
          </div>
          <div className="session-card">
            <Activity size={28} />
            <div>
              <strong>{latestActivity ? `${latestActivity.calories} calories` : 'Start tracking'}</strong>
              <span>{latestActivity ? `${latestActivity.distance.toFixed(1)} km in ${latestActivity.duration} min` : 'Add your first workout to unlock analytics.'}</span>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
