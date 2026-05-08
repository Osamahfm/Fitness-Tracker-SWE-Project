import { useAppContext } from '../context/useAppContext';
import { Flame, Footprints, Salad, Target } from 'lucide-react';
import { getUserActivityMetrics } from '../utils/userMetrics';
import { getRoleProfile } from '../utils/userRoles';

const mealsHighCal = ["Grilled Chicken Breast with Quinoa", "Salmon with Sweet Potato Mash", "Large Tuna Salad with Olive Oil"];
const mealsLowCal = ["Greek Yogurt with Mixed Berries", "Avocado Toast with a Poached Egg", "Protein Shake with Almond Milk"];

const mealsPageByRole = {
  customer: {
    energyLabel: 'Energy Output',
    movementLabel: 'Movement Volume',
    mealEyebrow: 'Meal Recommendation Module',
    mealTitle: 'Meal suggestion',
    mealCopy: "A practical meal direction based on today's tracked energy output.",
    goalEyebrow: 'Goal Recommendation Module',
    goalTitle: 'Goal suggestion',
    goalCopy: 'A clear next step, tuned to your recent activity volume.'
  },
  trainer: {
    energyLabel: 'Client Energy Output',
    movementLabel: 'Client Movement Volume',
    mealEyebrow: 'Trainer Meal Guidance',
    mealTitle: 'Client meal direction',
    mealCopy: 'A coaching-ready meal direction based on recent session output.',
    goalEyebrow: 'Trainer Goal Planning',
    goalTitle: 'Client goal direction',
    goalCopy: 'A practical coaching next step, tuned to the tracked workload.'
  },
  admin: {
    energyLabel: 'Calculated Output',
    movementLabel: 'Stored Movement',
    mealEyebrow: 'Recommendation QA',
    mealTitle: 'Meal rule output',
    mealCopy: 'A data-driven recommendation generated from the current activity record set.',
    goalEyebrow: 'Goal Rule QA',
    goalTitle: 'Goal rule output',
    goalCopy: 'A check of profile and activity inputs used by the recommendation logic.'
  }
};

export default function MealsAndGoals() {
  const { state } = useAppContext();
  const role = getRoleProfile(state.profile.role).value;
  const pageCopy = mealsPageByRole[role] || mealsPageByRole.customer;

  const metrics = getUserActivityMetrics(state.activities);
  const activityCalories = metrics.today.count > 0 ? metrics.today.calories : metrics.week.calories;
  const activityDistance = metrics.today.count > 0 ? metrics.today.distance : metrics.week.distance;

  const suggestedMeal = activityCalories >= 500
    ? mealsHighCal[Math.floor(activityCalories % mealsHighCal.length)]
    : mealsLowCal[Math.floor(activityCalories % mealsLowCal.length)];

  const mealText = state.activities.length === 0
    ? "Save activity data to generate a meal suggestion."
    : (activityCalories >= 500
      ? `High energy output detected! We recommend: ${suggestedMeal}.`
      : `Light activity day. We recommend: ${suggestedMeal}.`);

  const goalText = state.activities.length === 0
    ? "Validate the user and save activity data to generate a goal suggestion."
    : (activityDistance >= 5
      ? "Goal suggestion: maintain consistency and increase weekly distance gradually."
      : "Goal suggestion: add one more short activity session to improve daily tracking progress.");

  const isReady = state.activities.length > 0;
  const activeWindow = metrics.today.count > 0 ? "today's" : "this week's";

  return (
    <section className="workspace">
      <div className="dashboard-grid">
        <article className="metric-card">
          <span><Flame size={18} /> {pageCopy.energyLabel}</span>
          <strong>{activityCalories}</strong>
          <p>Using {activeWindow} real activity data for this logged-in user.</p>
        </article>
        <article className="metric-card">
          <span><Footprints size={18} /> {pageCopy.movementLabel}</span>
          <strong>{activityDistance.toFixed(1)} km</strong>
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
          <p className="eyebrow">{pageCopy.mealEyebrow}</p>
          <h3>{pageCopy.mealTitle}</h3>
          <p className="panel-copy">{pageCopy.mealCopy}</p>
        </div>
        <div className={`recommendation-box ${isReady ? 'ready' : ''}`}>
          {mealText}
        </div>
        <div className="mini-list">
          {(activityCalories >= 500 ? mealsHighCal : mealsLowCal).map((meal) => (
            <span key={meal}>{meal}</span>
          ))}
        </div>
      </div>
      <div className="panel recommendation-panel">
        <div className="panel-heading">
          <p className="eyebrow">{pageCopy.goalEyebrow}</p>
          <h3>{pageCopy.goalTitle}</h3>
          <p className="panel-copy">{pageCopy.goalCopy}</p>
        </div>
        <div className={`recommendation-box ${isReady ? 'ready' : ''}`}>
          {state.profile.validated && isReady ? `${state.profile.goal}: ${goalText}` : goalText}
        </div>
      </div>
      </section>
    </section>
  );
}
