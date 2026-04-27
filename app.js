const state = {
  profile: {
    name: "",
    email: "",
    goal: "Body Recompose",
    weight: 75,
    validated: false
  },
  activities: [],
  alarm: null
};

const factors = {
  walk: { label: "Walking", met: 3.5 },
  run: { label: "Running", met: 8.3 },
  cycle: { label: "Cycling", met: 6.8 },
  training: { label: "Private Training", met: 5.5 }
};

const effortLabels = {
  "1.0": "Light",
  "1.35": "Moderate",
  "1.75": "High"
};

const profileForm = document.querySelector("#profileForm");
const activityForm = document.querySelector("#activityForm");
const alarmForm = document.querySelector("#alarmForm");

function getNumber(id) {
  return Number(document.querySelector(id).value || 0);
}

function estimateCalories() {
  const type = document.querySelector("#activityType").value;
  const duration = getNumber("#duration");
  const effort = getNumber("#effort");
  const weight = Number(state.profile.weight || getNumber("#weight") || 75);
  const met = factors[type].met;
  return Math.max(0, Math.round((met * 3.5 * weight * duration * effort) / 200));
}

function updateLiveCalories() {
  document.querySelector("#liveCalories").textContent = estimateCalories();
}

function updateMetrics() {
  const totalCalories = state.activities.reduce((sum, activity) => sum + activity.calories, 0);
  const totalDistance = state.activities.reduce((sum, activity) => sum + activity.distance, 0);
  document.querySelector("#caloriesMetric").textContent = totalCalories;
  document.querySelector("#distanceMetric").textContent = totalDistance.toFixed(1);
  document.querySelector("#activityCount").textContent = state.activities.length;
  document.querySelector("#goalMetric").textContent = state.profile.goal.replace("User ", "");
}

function updateProfileView() {
  const profileName = document.querySelector("#profileName");
  const validationTitle = document.querySelector("#validationTitle");
  const validationText = document.querySelector("#validationText");
  const dot = document.querySelector(".dot");

  profileName.textContent = state.profile.validated ? state.profile.name : "Guest User";
  validationTitle.textContent = state.profile.validated ? "Validated" : "Pending";
  validationText.textContent = state.profile.validated
    ? `${state.profile.name} can log in and save daily physical activity records.`
    : "Complete the account details to validate the user profile.";
  dot.classList.toggle("valid", state.profile.validated);
}

function renderActivities() {
  const table = document.querySelector("#activityTable");
  if (!state.activities.length) {
    table.innerHTML = '<tr><td colspan="5">No activity records saved yet.</td></tr>';
    return;
  }

  table.innerHTML = state.activities.map((activity) => `
    <tr>
      <td>${activity.label}</td>
      <td>${activity.distance.toFixed(1)} km</td>
      <td>${activity.duration} min</td>
      <td>${activity.effort}</td>
      <td>${activity.calories}</td>
    </tr>
  `).join("");
}

function updateRecommendations() {
  const meal = document.querySelector("#mealRecommendation");
  const goal = document.querySelector("#goalRecommendation");
  const totalCalories = state.activities.reduce((sum, activity) => sum + activity.calories, 0);
  const totalDistance = state.activities.reduce((sum, activity) => sum + activity.distance, 0);

  if (!state.activities.length) {
    meal.textContent = "Save activity data to generate a meal suggestion.";
    goal.textContent = "Validate the user and save activity data to generate a goal suggestion.";
    meal.classList.remove("ready");
    goal.classList.remove("ready");
    return;
  }

  const mealText = totalCalories >= 500
    ? "Suggested meal: balanced protein meal with carbohydrates and water after high activity output."
    : "Suggested meal: light balanced meal and hydration to support daily activity recovery.";
  const goalText = totalDistance >= 5
    ? "Goal suggestion: maintain consistency and increase weekly distance gradually."
    : "Goal suggestion: add one more short activity session to improve daily tracking progress.";

  meal.textContent = mealText;
  goal.textContent = state.profile.validated
    ? `${state.profile.goal}: ${goalText}`
    : goalText;
  meal.classList.add("ready");
  goal.classList.add("ready");
}

function refresh() {
  updateLiveCalories();
  updateMetrics();
  updateProfileView();
  renderActivities();
  updateRecommendations();
}

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.profile = {
    name: document.querySelector("#fullName").value.trim(),
    email: document.querySelector("#email").value.trim(),
    goal: document.querySelector("#goal").value,
    weight: getNumber("#weight"),
    validated: true
  };
  refresh();
});

activityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const type = document.querySelector("#activityType").value;
  const effort = document.querySelector("#effort").value;
  state.activities.unshift({
    label: factors[type].label,
    distance: getNumber("#distance"),
    duration: getNumber("#duration"),
    effort: effortLabels[effort],
    calories: estimateCalories()
  });
  refresh();
});

alarmForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const time = document.querySelector("#alarmTime").value;
  const note = document.querySelector("#alarmNote").value.trim();
  state.alarm = { time, note };
  const alarmStatus = document.querySelector("#alarmStatus");
  alarmStatus.textContent = `Reminder set for ${time}: ${note}`;
  alarmStatus.classList.add("ready");
});

["#activityType", "#distance", "#duration", "#effort", "#weight"].forEach((selector) => {
  document.querySelector(selector).addEventListener("input", updateLiveCalories);
});

document.querySelectorAll(".nav-list a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-list a").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

refresh();
