import { useAppContext } from '../context/useAppContext';
import { Activity, Flame, Footprints, Target, Timer } from 'lucide-react';
import { getDailyCalorieTarget, getUserActivityMetrics } from '../utils/userMetrics';

export default function Dashboard() {
  const { state } = useAppContext();

  const metrics = getUserActivityMetrics(state.activities);
  const dailyCalorieTarget = getDailyCalorieTarget(state.profile);
  const progress = Math.min(Math.round((metrics.today.calories / dailyCalorieTarget) * 100), 100);
  const latestActivity = metrics.latestActivity;
  const hasWeeklyData = metrics.weeklyActivity.some((day) => day.count > 0);

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
            <span>today's goal</span>
          </div>
        </div>
      </div>

      <section className="dashboard-grid">
        <article className="metric-card accent-card">
          <span><Flame size={18} /> Today's Calories</span>
          <strong>{metrics.today.calories}</strong>
          <p>From {metrics.today.count} activity record(s) saved by this user today.</p>
        </article>
        <article className="metric-card">
          <span><Footprints size={18} /> Today's Distance</span>
          <strong>{metrics.today.distance.toFixed(1)} km</strong>
          <p>Only this logged-in user's saved distance is counted here.</p>
        </article>
        <article className="metric-card">
          <span><Timer size={18} /> Weekly Time</span>
          <strong>{metrics.week.duration} min</strong>
          <p>Workout minutes from the last seven calendar days.</p>
        </article>
        <article className="metric-card">
          <span><Target size={18} /> Current Goal</span>
          <strong>{state.profile.goal.replace('User ', '')}</strong>
          <p>Daily burn target is personalized from profile weight and goal.</p>
        </article>
      </section>

      <section className="workspace two-column">
        <div className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Workout Overview</p>
            <h3>Weekly activity</h3>
            <p className="panel-copy">Calories grouped from this user's real saved activity records.</p>
          </div>
          <div className={`bar-chart ${hasWeeklyData ? '' : 'empty-chart'}`} aria-label="Weekly activity chart">
            {metrics.weeklyActivity.map((day) => (
              <span
                key={day.key}
                style={{ '--height': `${day.height}%` }}
                title={`${day.label}: ${day.calories} calories`}
              >
                <small>{day.label}</small>
              </span>
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
