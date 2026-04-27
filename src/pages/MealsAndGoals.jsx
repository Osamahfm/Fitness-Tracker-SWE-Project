import { useAppContext } from '../context/useAppContext';

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
    <section className="workspace two-column">
      <div className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Meal Recommendation Module</p>
          <h3>Meal Suggestion</h3>
        </div>
        <div className={`recommendation-box ${isReady ? 'ready' : ''}`}>
          {mealText}
        </div>
      </div>
      <div className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Goal Recommendation Module</p>
          <h3>Goal Suggestion</h3>
        </div>
        <div className={`recommendation-box ${isReady ? 'ready' : ''}`}>
          {state.profile.validated && isReady ? `${state.profile.goal}: ${goalText}` : goalText}
        </div>
      </div>
    </section>
  );
}
