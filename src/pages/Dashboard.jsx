import { useAppContext } from '../context/useAppContext';

export default function Dashboard() {
  const { state } = useAppContext();

  const totalCalories = state.activities.reduce((sum, activity) => sum + activity.calories, 0);
  const totalDistance = state.activities.reduce((sum, activity) => sum + activity.distance, 0);

  return (
    <section className="dashboard-grid">
      <article className="metric-card">
        <span>Calories Burned</span>
        <strong>{totalCalories}</strong>
        <p>Calculated from physical activity distance, duration, and intensity.</p>
      </article>
      <article className="metric-card">
        <span>Distance</span>
        <strong>{totalDistance.toFixed(1)} km</strong>
        <p>Manual activity input, as defined by the project assumptions.</p>
      </article>
      <article className="metric-card">
        <span>Activities Saved</span>
        <strong>{state.activities.length}</strong>
        <p>Saved records feed the daily activity report.</p>
      </article>
      <article className="metric-card">
        <span>Current Goal</span>
        <strong>{state.profile.goal.replace("User ", "")}</strong>
        <p>Recommendation updates from profile and activity data.</p>
      </article>
    </section>
  );
}
