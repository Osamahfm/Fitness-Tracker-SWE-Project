export const defaultRole = 'customer';

export const roleOptions = [
  {
    value: 'customer',
    label: 'Customer',
    description: 'Track workouts, meals, goals, reminders, and personal progress.'
  },
  {
    value: 'trainer',
    label: 'Trainer',
    description: 'Guide fitness sessions and review activity progress with a coaching lens.'
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Backend Developer & Software Engineer workspace owner.'
  }
];

export function normalizeRole(role) {
  const value = String(role || defaultRole).toLowerCase();
  return roleOptions.some((option) => option.value === value) ? value : defaultRole;
}

export function getRoleProfile(role) {
  return roleOptions.find((option) => option.value === normalizeRole(role)) || roleOptions[0];
}

const roleInterfaces = {
  customer: {
    workspaceTitle: 'Customer Activity Workspace',
    topbarEyebrow: 'Fitness Tracker',
    navRoutes: ['/', '/activity', '/reports', '/recommendations', '/alarms', '/profile'],
    navLabels: {
      '/': 'Dashboard',
      '/activity': 'Workout',
      '/reports': 'Analytics',
      '/recommendations': 'Nutrition',
      '/alarms': 'Alarms',
      '/profile': 'Profile'
    },
    insights: {
      activeDays: 'Active Days',
      bestDay: 'Best Day',
      streak: 'Current Streak'
    },
    metrics: {
      calories: {
        label: "Today's Calories",
        copy: (count) => `From ${count} activity record(s) saved by this user today.`
      },
      distance: {
        label: "Today's Distance",
        copy: "Only this logged-in user's saved distance is counted here."
      },
      time: {
        label: 'Weekly Time',
        copy: 'Workout minutes from the last seven calendar days.'
      },
      goal: {
        label: 'Current Goal',
        copy: 'Daily burn target is personalized from profile weight and goal.'
      }
    },
    chart: {
      eyebrow: 'Workout Overview',
      title: 'Weekly activity',
      copy: "Calories grouped from this user's real saved activity records."
    },
    focus: {
      eyebrow: 'Next Best Move',
      emptyTitle: 'No activity yet',
      emptyValue: 'Start tracking',
      emptyCopy: 'Add your first workout to unlock analytics.',
      badge: (score) => `${score}% consistency`,
      detail: (insights) => `Favorite activity: ${insights.favoriteActivity} - Avg burn: ${insights.averageDailyCalories} cal/day`
    },
    actions: [
      { label: 'Log Workout', description: 'Record distance, duration, effort, and calories.', to: '/activity' },
      { label: 'Review Nutrition', description: 'See meal and goal recommendations.', to: '/recommendations' },
      { label: 'Set Reminder', description: 'Schedule your next activity window.', to: '/alarms' }
    ]
  },
  trainer: {
    workspaceTitle: 'Trainer Coaching Workspace',
    topbarEyebrow: 'Trainer Portal',
    navRoutes: ['/', '/activity', '/reports', '/recommendations', '/alarms', '/profile'],
    navLabels: {
      '/': 'Coaching Hub',
      '/activity': 'Session Builder',
      '/reports': 'Client Analytics',
      '/recommendations': 'Meal Plans',
      '/alarms': 'Follow-ups',
      '/profile': 'Trainer Profile'
    },
    insights: {
      activeDays: 'Session Days',
      bestDay: 'Peak Session',
      streak: 'Coaching Streak'
    },
    metrics: {
      calories: {
        label: 'Client Burn',
        copy: (count) => `${count} tracked session record(s) available for coaching review today.`
      },
      distance: {
        label: 'Movement Volume',
        copy: 'Distance gives the trainer a quick read on workload.'
      },
      time: {
        label: 'Weekly Coaching Time',
        copy: 'Workout minutes from the current seven-day coaching window.'
      },
      goal: {
        label: 'Client Goal',
        copy: 'Use the selected goal to shape the next training session.'
      }
    },
    chart: {
      eyebrow: 'Coaching Overview',
      title: 'Client activity trend',
      copy: 'A weekly view for spotting consistency, fatigue, and momentum.'
    },
    focus: {
      eyebrow: 'Coaching Focus',
      emptyTitle: 'No client session yet',
      emptyValue: 'Build a session',
      emptyCopy: 'Add a workout record to begin coaching from real activity data.',
      badge: (score) => `${score}% client consistency`,
      detail: (insights) => `Preferred activity: ${insights.favoriteActivity} - Avg client burn: ${insights.averageDailyCalories} cal/day`
    },
    actions: [
      { label: 'Build Session', description: 'Plan and save the next workout record.', to: '/activity' },
      { label: 'Review Client Data', description: 'Filter, export, and audit progress.', to: '/reports' },
      { label: 'Plan Meal Guidance', description: 'Match meals to activity output.', to: '/recommendations' }
    ]
  },
  admin: {
    workspaceTitle: 'Admin System Workspace',
    topbarEyebrow: 'Backend Developer & Software Engineer',
    navRoutes: ['/', '/activity', '/reports', '/readiness', '/profile'],
    navLabels: {
      '/': 'System Hub',
      '/activity': 'Activity QA',
      '/reports': 'Data Reports',
      '/readiness': 'Readiness',
      '/profile': 'Admin Profile'
    },
    insights: {
      activeDays: 'Data Days',
      bestDay: 'Peak Load',
      streak: 'Active Run'
    },
    metrics: {
      calories: {
        label: 'Calculated Burn',
        copy: (count) => `${count} backend-calculated activity record(s) saved today.`
      },
      distance: {
        label: 'Tracked Distance',
        copy: 'Distance values validate the activity data path.'
      },
      time: {
        label: 'Recorded Runtime',
        copy: 'Workout minutes stored across the last seven calendar days.'
      },
      goal: {
        label: 'Profile Rule',
        copy: 'Goal and weight values drive calorie target logic.'
      }
    },
    chart: {
      eyebrow: 'System Data Overview',
      title: 'Activity data flow',
      copy: 'A weekly signal for validating stored records and dashboard calculations.'
    },
    focus: {
      eyebrow: 'System Focus',
      emptyTitle: 'No records yet',
      emptyValue: 'Run QA',
      emptyCopy: 'Create an activity record to validate the calculation and reporting flow.',
      badge: (score) => `${score}% data coverage`,
      detail: (insights) => `Dominant record type: ${insights.favoriteActivity} - Avg computed burn: ${insights.averageDailyCalories} cal/day`
    },
    actions: [
      { label: 'Check Readiness', description: 'Review API health, UAT, and monitoring.', to: '/readiness' },
      { label: 'Audit Reports', description: 'Inspect saved records and CSV output.', to: '/reports' },
      { label: 'Test Activity Engine', description: 'Validate calorie calculation inputs.', to: '/activity' }
    ]
  }
};

export function getRoleInterface(role) {
  return roleInterfaces[normalizeRole(role)] || roleInterfaces[defaultRole];
}

export function getRoleDashboardMessage(role, name) {
  const userName = name || 'there';
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'trainer') {
    return `Coach your next session, ${userName}. Review progress, spot patterns, and keep the plan moving.`;
  }

  if (normalizedRole === 'admin') {
    return `Welcome back, ${userName}. Monitor the tracker like a Backend Developer & Software Engineer.`;
  }

  return `Ready for your next move, ${userName}? Track workouts, calories, meals, and reminders in one place.`;
}
