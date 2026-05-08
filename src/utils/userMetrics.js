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

function getActivityDaySet(activities) {
  return new Set(
    activities
      .map((activity) => {
        const activityDate = toActivityDate(activity);
        return activityDate ? dayKey(activityDate) : null;
      })
      .filter(Boolean)
  );
}

function getActivityStreak(activities, now = new Date()) {
  const activeDays = getActivityDaySet(activities);
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  let streak = 0;
  while (activeDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getFavoriteActivity(activities) {
  if (!activities.length) return null;

  const counts = activities.reduce((activityCounts, activity) => {
    const label = activity.label || 'Activity';
    activityCounts.set(label, (activityCounts.get(label) || 0) + 1);
    return activityCounts;
  }, new Map());

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
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

export function getActivityInsights(activities, dailyCalorieTarget, now = new Date()) {
  const metrics = getUserActivityMetrics(activities);
  const activeDays = metrics.weeklyActivity.filter((day) => day.count > 0).length;
  const bestDay = metrics.weeklyActivity.reduce(
    (best, day) => (day.calories > best.calories ? day : best),
    metrics.weeklyActivity[0]
  );
  const remainingCalories = Math.max(dailyCalorieTarget - metrics.today.calories, 0);
  const averageDailyCalories = Math.round(metrics.week.calories / 7);
  const streak = getActivityStreak(activities, now);
  const favoriteActivity = getFavoriteActivity(activities);
  const consistencyScore = Math.round((activeDays / 7) * 100);

  let focusMessage = 'Log a workout to unlock weekly coaching insights.';
  if (metrics.today.count > 0 && remainingCalories === 0) {
    focusMessage = 'Daily calorie goal reached. Keep the next session light or focus on recovery.';
  } else if (metrics.today.count > 0) {
    focusMessage = `${remainingCalories} calories left to reach today's burn target.`;
  } else if (activeDays >= 4) {
    focusMessage = 'Your week has momentum. Add a short session today to keep the streak alive.';
  } else if (activities.length > 0) {
    focusMessage = 'Start today with a manageable session and rebuild weekly consistency.';
  }

  return {
    activeDays,
    averageDailyCalories,
    bestDay,
    consistencyScore,
    favoriteActivity: favoriteActivity || 'Not enough data',
    focusMessage,
    remainingCalories,
    streak
  };
}
