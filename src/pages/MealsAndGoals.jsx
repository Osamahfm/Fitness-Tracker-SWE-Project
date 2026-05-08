import { useAppContext } from '../context/useAppContext';
import { Flame, Footprints, Salad, Target } from 'lucide-react';

const mealsHighCal = ["Grilled Chicken Breast with Quinoa", "Salmon with Sweet Potato Mash", "Large Tuna Salad with Olive Oil"];
const mealsLowCal = ["Greek Yogurt with Mixed Berries", "Avocado Toast with a Poached Egg", "Protein Shake with Almond Milk"];

export default function MealsAndGoals() {
  const { state } = useAppContext();

  const totalCalories = state.activities.reduce((sum, activity) => sum + activity.calories, 0);
  const totalDistance = state.activities.reduce((sum, activity) => sum + activity.distance, 0);

  const suggestedMeal = totalCalories >= 500 
    ? mealsHighCal[Math.floor(totalCalories % mealsHighCal.length)] // Deterministic based on calories
    : mealsLowCal[Math.floor(totalCalories % mealsLowCal.length)];

  const mealText = state.activities.length === 0
    ? "Save activity data to generate a meal suggestion."
    : (totalCalories >= 500
      ? `High energy output detected! We recommend: ${suggestedMeal}.`
      : `Light activity day. We recommend: ${suggestedMeal}.`);

  const goalText = state.activities.length === 0
    ? "Validate the user and save activity data to generate a goal suggestion."
    : (totalDistance >= 5
      ? "Goal suggestion: maintain consistency and increase weekly distance gradually."
      : "Goal suggestion: add one more short activity session to improve daily tracking progress.");

  const isReady = state.activities.length > 0;

  return (
    <section className="workspace">
      <div className="dashboard-grid">
        <article className="metric-card">
          <span><Flame size={18} /> Energy Output</span>
          <strong>{totalCalories}</strong>
          <p>Burned calories guide meal intensity and recovery needs.</p>
        </article>
        <article className="metric-card">
          <span><Footprints size={18} /> Movement Volume</span>
          <strong>{totalDistance.toFixed(1)} km</strong>
          <p>Distance helps tune the next achievable daily target.</p>
        </article>
        <article className="metric-card accent-card">
          <span><Salad size={18} /> Suggested Meal</span>
          <strong>{isReady ? suggestedMeal.split(' with ')[0] : 'Pending'}</strong>
          <p>{isReady ? 'Matched to your current activity output.' : 'Add activity data to unlock suggestions.'}</p>
        </article>
        <article className="metric-card">
          <span><Target size={18} /> Goal Path</span>
          <strong>{state.profile.goal.replace('User ', '')}</strong>
          <p>Recommendation logic uses your profile and activity history.</p>
        </article>
      </div>

      <section className="two-column">
      <div className="panel recommendation-panel">
        <div className="panel-heading">
          <p className="eyebrow">Meal Recommendation Module</p>
          <h3>Meal suggestion</h3>
          <p className="panel-copy">A practical meal direction based on today's tracked energy output.</p>
        </div>
        <div className={`recommendation-box ${isReady ? 'ready' : ''}`}>
          {mealText}
        </div>
        <div className="mini-list">
          {(totalCalories >= 500 ? mealsHighCal : mealsLowCal).map((meal) => (
            <span key={meal}>{meal}</span>
          ))}
        </div>
      </div>
      <div className="panel recommendation-panel">
        <div className="panel-heading">
          <p className="eyebrow">Goal Recommendation Module</p>
          <h3>Goal suggestion</h3>
          <p className="panel-copy">A clear next step, tuned to your recent activity volume.</p>
        </div>
        <div className={`recommendation-box ${isReady ? 'ready' : ''}`}>
          {state.profile.validated && isReady ? `${state.profile.goal}: ${goalText}` : goalText}
        </div>
      </div>
      </section>
    </section>
  );
}
