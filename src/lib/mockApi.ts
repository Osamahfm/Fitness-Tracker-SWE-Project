// Mock API Client - Provides demo data when PHP backend is unavailable
// This allows the frontend to work standalone for demonstration

const mockUser = {
  id: 1,
  full_name: 'Alex Johnson',
  email: 'alex@example.com',
  age: 28,
  weight_kg: 75,
  height_cm: 180,
  gender: 'male',
  activity_level: 'moderately_active',
  fitness_goal: 'body_recomposition',
  daily_calorie_target: 2400,
  bmr: 1736,
  tdee: 2691,
};

const mockActivities = [
  { id: 1, activity_name: 'Running', activity_category: 'cardio', met_value: 9.8, duration_minutes: 30, distance_km: 5.2, intensity: 'moderate', calories_burned: 385, notes: 'Morning run in the park', logged_at: '2026-05-09T07:30:00' },
  { id: 2, activity_name: 'Weight Lifting', activity_category: 'strength', met_value: 6, duration_minutes: 45, distance_km: null, intensity: 'high', calories_burned: 340, notes: 'Upper body day', logged_at: '2026-05-09T18:00:00' },
  { id: 3, activity_name: 'Walking', activity_category: 'cardio', met_value: 3.5, duration_minutes: 20, distance_km: 1.5, intensity: 'low', calories_burned: 88, notes: 'Evening walk', logged_at: '2026-05-09T19:30:00' },
];

const mockMeals = [
  { id: 1, name: 'Greek Yogurt Parfait', meal_type: 'breakfast', calories: 280, protein_g: 20, carbs_g: 35, fats_g: 6, fiber_g: 3, consumed_at: '2026-05-09T08:00:00' },
  { id: 2, name: 'Grilled Chicken Salad', meal_type: 'lunch', calories: 420, protein_g: 35, carbs_g: 15, fats_g: 22, fiber_g: 5, consumed_at: '2026-05-09T13:00:00' },
  { id: 3, name: 'Protein Smoothie', meal_type: 'snack', calories: 250, protein_g: 25, carbs_g: 30, fats_g: 4, fiber_g: 2, consumed_at: '2026-05-09T16:00:00' },
];

const mockGoals = [
  { id: 1, title: 'Weekly Distance Goal', description: 'Run 30km this week', goal_type: 'weekly_distance', target_value: 30, current_value: 18.5, unit: 'km', start_date: '2026-05-04', end_date: '2026-05-10', status: 'active', progress_percentage: 61.7, reminders_enabled: true },
  { id: 2, title: 'Weekly Duration Goal', description: 'Exercise 300 minutes this week', goal_type: 'weekly_duration', target_value: 300, current_value: 195, unit: 'minutes', start_date: '2026-05-04', end_date: '2026-05-10', status: 'active', progress_percentage: 65, reminders_enabled: true },
  { id: 3, title: 'Calorie Burn Target', description: 'Burn 3500 kcal this week', goal_type: 'weekly_calories', target_value: 3500, current_value: 2800, unit: 'kcal', start_date: '2026-05-04', end_date: '2026-05-10', status: 'active', progress_percentage: 80, reminders_enabled: false },
];

const mockAlarms = [
  { id: 1, title: 'Morning Run', description: 'Time for your daily run!', alarm_type: 'activity_reminder', scheduled_time: '07:00:00', scheduled_days: 'monday,tuesday,wednesday,thursday,friday', is_active: true },
  { id: 2, title: 'Protein Check', description: 'Have you hit your protein goal?', alarm_type: 'meal_reminder', scheduled_time: '20:00:00', scheduled_days: 'monday,tuesday,wednesday,thursday,friday,saturday,sunday', is_active: true },
  { id: 3, title: 'Weekly Review', description: 'Check your weekly progress', alarm_type: 'goal_reminder', scheduled_time: '18:00:00', scheduled_days: 'sunday', is_active: true },
];

const mockRecommendations = [
  { id: 1, goal_type: 'body_recomposition', meal_type: 'breakfast', name: 'Egg White Scramble', description: 'High protein, moderate fat', calories: 320, protein_g: 28, carbs_g: 12, fats_g: 18, recipe: '4 egg whites, 1 whole egg, spinach, mushrooms, whole grain toast' },
  { id: 2, goal_type: 'body_recomposition', meal_type: 'dinner', name: 'Chicken Breast with Sweet Potato', description: 'Lean dinner option', calories: 520, protein_g: 40, carbs_g: 55, fats_g: 12, recipe: '200g chicken breast, 200g sweet potato, green beans, olive oil' },
  { id: 3, goal_type: 'body_recomposition', meal_type: 'lunch', name: 'Tuna Quinoa Bowl', description: 'Complete protein source', calories: 480, protein_g: 35, carbs_g: 45, fats_g: 16, recipe: '150g tuna, 1 cup quinoa, edamame, seaweed, sesame dressing' },
];

const mockActivityTypes = [
  { id: 1, name: 'Running', category: 'cardio', met_value: 9.8, icon: 'running', description: 'Running at moderate pace' },
  { id: 2, name: 'Jogging', category: 'cardio', met_value: 7.0, icon: 'running', description: 'Light jogging' },
  { id: 3, name: 'Walking', category: 'cardio', met_value: 3.5, icon: 'walking', description: 'Brisk walking' },
  { id: 4, name: 'Cycling', category: 'cardio', met_value: 7.5, icon: 'cycling', description: 'Cycling at moderate pace' },
  { id: 5, name: 'Swimming', category: 'cardio', met_value: 8.0, icon: 'waves', description: 'Swimming laps' },
  { id: 6, name: 'Weight Lifting', category: 'strength', met_value: 6.0, icon: 'dumbbell', description: 'Resistance weight training' },
  { id: 7, name: 'Yoga', category: 'flexibility', met_value: 2.5, icon: 'heart', description: 'Yoga practice' },
  { id: 8, name: 'HIIT', category: 'cardio', met_value: 11.0, icon: 'flame', description: 'High-intensity interval training' },
  { id: 9, name: 'Basketball', category: 'sports', met_value: 6.5, icon: 'circle', description: 'Playing basketball' },
  { id: 10, name: 'Hiking', category: 'daily', met_value: 6.0, icon: 'mountain', description: 'Hiking on trails' },
];

const weeklyActivity = [
  { day: '2026-05-03', activities: 2, duration: 60, calories: 520 },
  { day: '2026-05-04', activities: 3, duration: 75, calories: 680 },
  { day: '2026-05-05', activities: 2, duration: 50, calories: 450 },
  { day: '2026-05-06', activities: 3, duration: 90, calories: 820 },
  { day: '2026-05-07', activities: 1, duration: 30, calories: 290 },
  { day: '2026-05-08', activities: 2, duration: 55, calories: 510 },
  { day: '2026-05-09', activities: 3, duration: 95, calories: 813 },
];

export function mockRequest(method: string, endpoint: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const res = handleMockRequest(method, endpoint, body);
        resolve(res);
      } catch (err: any) {
        reject(new Error(err.message || 'Mock API error'));
      }
    }, 300);
  });
}

function handleMockRequest(method: string, endpoint: string, body?: any): any {
  // Auth
  if (endpoint === '/auth/register' && method === 'POST') {
    return { success: true, message: 'Registration successful', data: { user: mockUser, token: 'mock-jwt-token' } };
  }
  if (endpoint === '/auth/login' && method === 'POST') {
    return { success: true, message: 'Login successful', data: { user: mockUser, token: 'mock-jwt-token' } };
  }
  if (endpoint === '/auth/me') {
    return { success: true, data: mockUser };
  }
  if (endpoint === '/auth/profile' && method === 'PUT') {
    return { success: true, message: 'Profile updated', data: { ...mockUser, ...body } };
  }

  // Activities
  if (endpoint === '/activities' && method === 'GET') {
    return { success: true, data: { activities: mockActivities, count: mockActivities.length } };
  }
  if (endpoint === '/activities' && method === 'POST') {
    const newActivity = { ...body, id: Date.now(), calories_burned: Math.round(body.duration_minutes * 8), activity_name: 'Activity', logged_at: new Date().toISOString() };
    mockActivities.unshift(newActivity as any);
    return { success: true, message: 'Activity logged', data: { activity: newActivity, calculation_method: 'MET-Based' } };
  }
  if (endpoint === '/activities/types') {
    return { success: true, data: { types: mockActivityTypes, grouped: {}, categories: ['cardio', 'strength', 'flexibility', 'sports', 'daily'] } };
  }
  if (endpoint === '/activities/summary') {
    return { success: true, data: { period: 'daily', summary: { total_activities: 3, total_duration: 95, total_distance: 6.7, total_calories: 813 } } };
  }
  if (endpoint.startsWith('/activities/') && method === 'DELETE') {
    const id = parseInt(endpoint.split('/').pop()!);
    const idx = mockActivities.findIndex(a => a.id === id);
    if (idx > -1) mockActivities.splice(idx, 1);
    return { success: true, message: 'Activity deleted' };
  }

  // Meals
  if (endpoint === '/meals' && method === 'GET') {
    return { success: true, data: { meals: mockMeals, daily_summary: { total_meals: 3, total_calories: 950, total_protein: 80, total_carbs: 80, total_fats: 32, total_fiber: 10 } } };
  }
  if (endpoint === '/meals' && method === 'POST') {
    const newMeal = { ...body, id: Date.now(), consumed_at: new Date().toISOString() };
    mockMeals.unshift(newMeal as any);
    return { success: true, message: 'Meal logged', data: newMeal };
  }
  if (endpoint === '/meals/recommendations') {
    return { success: true, data: { recommendations: mockRecommendations, macro_targets: { protein_pct: 40, carbs_pct: 30, fats_pct: 30, description: 'High protein for simultaneous muscle gain and fat loss' }, user_goal: 'body_recomposition', tdee: 2691 } };
  }
  if (endpoint.startsWith('/meals/') && method === 'DELETE') {
    const id = parseInt(endpoint.split('/').pop()!);
    const idx = mockMeals.findIndex(m => m.id === id);
    if (idx > -1) mockMeals.splice(idx, 1);
    return { success: true, message: 'Meal deleted' };
  }

  // Goals
  if (endpoint === '/goals' && method === 'GET') {
    return { success: true, data: { goals: mockGoals, active_count: mockGoals.length } };
  }
  if (endpoint === '/goals' && method === 'POST') {
    const newGoal = { ...body, id: Date.now(), current_value: 0, progress_percentage: 0, status: 'active', reminders_enabled: true };
    mockGoals.push(newGoal as any);
    return { success: true, message: 'Goal created', data: newGoal };
  }
  if (endpoint === '/goals/recommendations') {
    return { success: true, data: { recommendations: [
      { type: 'weekly_distance', title: 'Build Endurance', description: 'Aim for 20km this week', target_value: 20, unit: 'km', category: 'endurance', suggested_duration_days: 7 },
      { type: 'weekly_duration', title: 'Consistency Challenge', description: 'Exercise 200 minutes this week', target_value: 200, unit: 'minutes', category: 'consistency', suggested_duration_days: 7 },
    ], user_patterns: { avg_daily_duration: 68, avg_daily_calories: 583, active_days: 7 }, user_goal: 'body_recomposition' } };
  }
  if (endpoint.includes('/progress') && method === 'PUT') {
    return { success: true, message: 'Progress updated' };
  }
  if (endpoint.includes('/status') && method === 'PUT') {
    return { success: true, message: 'Status updated' };
  }
  if (endpoint.startsWith('/goals/') && method === 'DELETE') {
    const id = parseInt(endpoint.split('/').pop()!);
    const idx = mockGoals.findIndex(g => g.id === id);
    if (idx > -1) mockGoals.splice(idx, 1);
    return { success: true, message: 'Goal deleted' };
  }

  // Alarms
  if (endpoint === '/alarms' && method === 'GET') {
    return { success: true, data: { alarms: mockAlarms, today: 'friday' } };
  }
  if (endpoint === '/alarms' && method === 'POST') {
    const newAlarm = { ...body, id: Date.now(), is_active: true };
    mockAlarms.push(newAlarm as any);
    return { success: true, message: 'Reminder created', data: newAlarm };
  }
  if (endpoint === '/alarms/today') {
    const todayAlarms = mockAlarms.filter(a => a.scheduled_days.includes('friday'));
    return { success: true, data: { alarms: todayAlarms, count: todayAlarms.length } };
  }
  if (endpoint.startsWith('/alarms/') && method === 'PUT') {
    return { success: true, message: 'Alarm updated' };
  }
  if (endpoint.startsWith('/alarms/') && method === 'DELETE') {
    const id = parseInt(endpoint.split('/').pop()!);
    const idx = mockAlarms.findIndex(a => a.id === id);
    if (idx > -1) mockAlarms.splice(idx, 1);
    return { success: true, message: 'Reminder deleted' };
  }

  // Dashboard
  if (endpoint === '/dashboard' || endpoint.startsWith('/dashboard?')) {
    return { success: true, data: {
      date: '2026-05-09',
      user: { name: mockUser.full_name, goal: mockUser.fitness_goal, daily_target: mockUser.daily_calorie_target, tdee: 2691, bmr: 1736 },
      daily_report: {
        date: '2026-05-09',
        activities: { total_count: 3, total_duration_min: 95, total_distance_km: 6.7, total_calories_burned: 813 },
        meals: { total_count: 3, total_calories_consumed: 950, protein_g: 80, carbs_g: 80, fats_g: 32 },
        net_calories: 137,
        goals_progress: mockGoals.map(g => ({ goal_id: g.id, title: g.title, goal_type: g.goal_type, current: g.current_value, target: g.target_value, unit: g.unit, percentage: g.progress_percentage })),
        summary_text: 'You completed 3 activities and burned 813 calories. You consumed 950 calories from your meals. You are in a caloric surplus of 137 kcal.',
      },
      activities: mockActivities,
      meals: mockMeals,
      goals: mockGoals,
      today_alarms: mockAlarms.filter(a => a.scheduled_days.includes('friday')),
      recommendations: mockRecommendations.slice(0, 4),
      weekly_activity: weeklyActivity,
    } };
  }
  if (endpoint === '/dashboard/weekly') {
    return { success: true, data: { daily_breakdown: weeklyActivity, week_totals: { total_activities: 16, total_duration: 455, total_calories: 4083, active_days: 7 }, user_goal: 'body_recomposition' } };
  }
  if (endpoint === '/dashboard/stats') {
    return { success: true, data: { activities: { total_activities: 128, total_duration: 3840, total_distance: 245.5, total_calories_burned: 28500 }, meals: { total_meals: 340, total_calories_consumed: 82000 }, goals: { total_goals: 12, completed_goals: 5 }, net_calories: 53500 } };
  }

  throw new Error(`Mock endpoint not found: ${method} ${endpoint}`);
}
