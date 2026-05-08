const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

function toActivityDate(activity) {
  if (activity.createdAt) {
    const createdDate = new Date(activity.createdAt);
    if (!Number.isNaN(createdDate.getTime())) return createdDate;
  }

  if (activity.date) {
    const reportedDate = new Date(activity.date);
    if (!Number.isNaN(reportedDate.getTime())) return reportedDate;
  }

  return null;
}

function dayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sumActivities(activities) {
  return activities.reduce(
    (totals, activity) => ({
      calories: totals.calories + Number(activity.calories || 0),
      distance: totals.distance + Number(activity.distance || 0),
      duration: totals.duration + Number(activity.duration || 0),
      count: totals.count + 1
    }),
    { calories: 0, distance: 0, duration: 0, count: 0 }
  );
}

export function getTodayActivities(activities, now = new Date()) {
  const today = dayKey(now);
  return activities.filter((activity) => {
    const activityDate = toActivityDate(activity);
    return activityDate && dayKey(activityDate) === today;
  });
}

export function getWeeklyActivitySummary(activities, now = new Date()) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return {
      key: dayKey(date),
      label: dayFormatter.format(date),
      calories: 0,
      distance: 0,
      duration: 0,
      count: 0
    };
  });

  const byDay = new Map(days.map((day) => [day.key, day]));

  activities.forEach((activity) => {
    const activityDate = toActivityDate(activity);
    if (!activityDate) return;
    const match = byDay.get(dayKey(activityDate));
    if (!match) return;

    match.calories += Number(activity.calories || 0);
    match.distance += Number(activity.distance || 0);
    match.duration += Number(activity.duration || 0);
    match.count += 1;
  });

  const maxCalories = Math.max(...days.map((day) => day.calories), 1);

  return days.map((day) => ({
    ...day,
    height: day.calories > 0 ? Math.max(Math.round((day.calories / maxCalories) * 100), 12) : 4
  }));
}

export function getUserActivityMetrics(activities) {
  const now = new Date();
  const todayActivities = getTodayActivities(activities);
  const weeklyActivity = getWeeklyActivitySummary(activities, now);
  const total = sumActivities(activities);
  const today = sumActivities(todayActivities);
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  const week = sumActivities(
    activities.filter((activity) => {
      const activityDate = toActivityDate(activity);
      if (!activityDate) return false;
      return activityDate >= weekStart && activityDate <= now;
    })
  );

  return {
    total,
    today,
    week,
    weeklyActivity,
    latestActivity: activities[0] || null
  };
}

export function getDailyCalorieTarget(profile) {
  const goal = String(profile.goal || '').toLowerCase();
  const weight = Number(profile.weight || 75);
  const baseTarget = Math.round(weight * 8);

  if (goal.includes('maintain')) return Math.max(baseTarget, 450);
  if (goal.includes('recompose')) return Math.max(baseTarget + 100, 550);
  return Math.max(baseTarget + 150, 600);
}
