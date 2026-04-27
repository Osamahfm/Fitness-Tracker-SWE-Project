export const activityFactors = {
  walk: { label: "Walking", met: 3.5 },
  run: { label: "Running", met: 8.3 },
  cycle: { label: "Cycling", met: 6.8 },
  training: { label: "Private Training", met: 5.5 }
};

export const effortLabels = {
  "1.0": "Light",
  "1.35": "Moderate",
  "1.75": "High"
};

export function estimateCalories({ type, weight, duration, effort }) {
  const met = activityFactors[type]?.met || activityFactors.walk.met;
  const safeWeight = Number(weight) || 75;
  const safeDuration = Number(duration) || 0;
  const safeEffort = Number(effort) || 1;

  return Math.max(0, Math.round((met * 3.5 * safeWeight * safeDuration * safeEffort) / 200));
}

export function validateCalorieInput(input) {
  const checks = [
    { label: "Activity type selected", passed: Boolean(activityFactors[input.type]) },
    { label: "Body weight is within accepted profile range", passed: Number(input.weight) >= 30 && Number(input.weight) <= 250 },
    { label: "Duration is greater than zero", passed: Number(input.duration) > 0 },
    { label: "Effort level is recognized", passed: Boolean(effortLabels[String(input.effort)]) }
  ];

  return {
    checks,
    passed: checks.every((check) => check.passed)
  };
}
