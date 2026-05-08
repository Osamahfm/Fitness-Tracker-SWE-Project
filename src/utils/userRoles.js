export const defaultRole = 'customer';

export const roleOptions = [
  {
    value: 'customer',
    label: 'Customer',
    description: 'Track workouts, meals, goals, reminders, and personal progress.',
    color: '#3B82F6'
  },
  {
    value: 'trainer',
    label: 'Trainer',
    description: 'Guide fitness sessions and review activity progress with a coaching lens.',
    color: '#8B5CF6'
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Backend Developer & Software Engineer workspace owner.',
    color: '#EF4444'
  }
];

export function normalizeRole(role) {
  const value = String(role || defaultRole).toLowerCase();
  return roleOptions.some((option) => option.value === value) ? value : defaultRole;
}

export function getRoleProfile(role) {
  return roleOptions.find((option) => option.value === normalizeRole(role)) || roleOptions[0];
}

// Role-based permissions and features
export const rolePermissions = {
  customer: {
    // UNIQUE: Can view only their own personal fitness data
    canViewPersonalDashboard: true,
    canEditPersonalProfile: true,
    canLogActivities: true,
    canViewPersonalReports: true,
    canSetReminders: true,
    canViewNutritionRecommendations: true,
    canViewMealPlans: false,
    canViewClientData: false,
    canCoachClients: false,
    canManageUsers: false,
    canAccessSystemSettings: false,
    canViewSystemHealth: false,
    canAuditData: false,
    canModifyRoles: false,
    canDeleteActivities: true,
    canExportData: false,
    
    // CUSTOMER-SPECIFIC FEATURES
    features: {
      personalFitnessTracking: true,
      activityLogging: true,
      reminders: true,
      personalGoalTracking: true,
      basicReporting: true,
      nutritionGuidance: true,
      // Customer CANNOT access:
      clientManagement: false,
      coachingTools: false,
      systemAdmin: false,
      dataAudit: false
    },
    
    // Allowed pages - CUSTOMER ONLY (namespaced)
    allowedPages: [
      '/customer/dashboard',
      '/customer/workout',
      '/customer/reports',
      '/customer/nutrition',
      '/customer/alarms',
      '/customer/profile'
    ],
    blockedPages: ['/trainer', '/admin']
  },

  trainer: {
    // UNIQUE: Can view only their coaching clients' data, NOT personal
    canViewPersonalDashboard: false,
    canEditPersonalProfile: true,
    canLogActivities: false,
    canViewPersonalReports: false,
    canSetReminders: false,
    canViewNutritionRecommendations: false,
    canViewMealPlans: true,
    canViewClientData: true,
    canCoachClients: true,
    canManageUsers: false,
    canAccessSystemSettings: false,
    canViewSystemHealth: false,
    canAuditData: false,
    canModifyRoles: false,
    canDeleteActivities: false,
    canExportData: true,
    
    // TRAINER-SPECIFIC FEATURES
    features: {
      personalFitnessTracking: false,
      activityLogging: false,
      reminders: false,
      personalGoalTracking: false,
      basicReporting: false,
      nutritionGuidance: false,
      // Trainer CAN access:
      clientManagement: true,
      coachingTools: true,
      mealPlanning: true,
      clientReporting: true,
      // Trainer CANNOT access:
      systemAdmin: false,
      dataAudit: false
    },
    
    // Allowed pages - TRAINER ONLY (namespaced)
    allowedPages: [
      '/trainer/hub',
      '/trainer/session-builder',
      '/trainer/client-analytics',
      '/trainer/meal-plans',
      '/trainer/profile'
    ],
    blockedPages: ['/customer', '/admin']
  },

  admin: {
    // UNIQUE: Full system access, can view all data for system validation
    canViewPersonalDashboard: false,
    canEditPersonalProfile: true,
    canLogActivities: false,
    canViewPersonalReports: false,
    canSetReminders: false,
    canViewNutritionRecommendations: false,
    canViewMealPlans: false,
    canViewClientData: false,
    canCoachClients: false,
    canManageUsers: true,
    canAccessSystemSettings: true,
    canViewSystemHealth: true,
    canAuditData: true,
    canModifyRoles: true,
    canDeleteActivities: false,
    canExportData: true,
    
    // ADMIN-SPECIFIC FEATURES
    features: {
      personalFitnessTracking: false,
      activityLogging: false,
      reminders: false,
      personalGoalTracking: false,
      basicReporting: false,
      nutritionGuidance: false,
      clientManagement: false,
      coachingTools: false,
      mealPlanning: false,
      clientReporting: false,
      // Admin ONLY:
      systemAdmin: true,
      dataAudit: true,
      systemHealth: true,
      userManagement: true,
      roleManagement: true
    },
    
    // Allowed pages - ADMIN ONLY (namespaced)
    allowedPages: [
      '/admin/system-hub',
      '/admin/activity-qa',
      '/admin/data-reports',
      '/admin/readiness',
      '/admin/profile'
    ],
    blockedPages: ['/customer', '/trainer']
  }
};

// Helper function to check if a role has a specific permission
export function hasPermission(role, permission) {
  const normalized = normalizeRole(role);
  return rolePermissions[normalized]?.[permission] || false;
}

// Helper function to check if a role can access a page
export function canAccessPage(role, page) {
  const normalized = normalizeRole(role);
  const permissions = rolePermissions[normalized];
  if (!permissions) return false;

  return permissions.allowedPages.includes(page);
}

// Helper function to check if a role has a specific feature
export function hasFeature(role, featureName) {
  const normalized = normalizeRole(role);
  return rolePermissions[normalized]?.features?.[featureName] || false;
}

const roleInterfaces = {
  customer: {
    workspaceTitle: 'Customer Activity Workspace',
    topbarEyebrow: 'Fitness Tracker',
    navRoutes: ['/customer/dashboard', '/customer/workout', '/customer/reports', '/customer/nutrition', '/customer/alarms', '/customer/profile'],
    navLabels: {
      '/customer/dashboard': 'Dashboard',
      '/customer/workout': 'Workout',
      '/customer/reports': 'Analytics',
      '/customer/nutrition': 'Nutrition',
      '/customer/alarms': 'Alarms',
      '/customer/profile': 'Profile'
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
      { label: 'Log Workout', description: 'Record distance, duration, effort, and calories.', to: '/customer/workout' },
      { label: 'Review Nutrition', description: 'See meal and goal recommendations.', to: '/customer/nutrition' },
      { label: 'Set Reminder', description: 'Schedule your next activity window.', to: '/customer/alarms' }
    ]
  },
  trainer: {
    workspaceTitle: 'Trainer Coaching Workspace',
    topbarEyebrow: 'Trainer Portal - Client Coaching',
    navRoutes: ['/trainer/hub', '/trainer/session-builder', '/trainer/client-analytics', '/trainer/meal-plans', '/trainer/profile'],
    navLabels: {
      '/trainer/hub': 'Coaching Hub',
      '/trainer/session-builder': 'Session Builder',
      '/trainer/client-analytics': 'Client Analytics',
      '/trainer/meal-plans': 'Meal Plans',
      '/trainer/profile': 'Trainer Profile'
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
      { label: 'Build Session', description: 'Plan and save the next workout record.', to: '/trainer/session-builder' },
      { label: 'Review Client Data', description: 'Filter, export, and audit progress.', to: '/trainer/client-analytics' },
      { label: 'Plan Meal Guidance', description: 'Match meals to activity output.', to: '/trainer/meal-plans' }
    ]
  },
  admin: {
    workspaceTitle: 'Admin System Workspace',
    topbarEyebrow: 'Backend Developer & Software Engineer',
    navRoutes: ['/admin/system-hub', '/admin/activity-qa', '/admin/data-reports', '/admin/readiness', '/admin/profile'],
    navLabels: {
      '/admin/system-hub': 'System Hub',
      '/admin/activity-qa': 'Activity QA',
      '/admin/data-reports': 'Data Reports',
      '/admin/readiness': 'Readiness',
      '/admin/profile': 'Admin Profile'
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
      { label: 'Check Readiness', description: 'Review API health, UAT, and monitoring.', to: '/admin/readiness' },
      { label: 'Audit Reports', description: 'Inspect saved records and CSV output.', to: '/admin/data-reports' },
      { label: 'Test Activity Engine', description: 'Validate calorie calculation inputs.', to: '/admin/activity-qa' }
    ]
  }
};

export function getRoleInterface(role) {
  return roleInterfaces[normalizeRole(role)] || roleInterfaces[defaultRole];
}

export function getRoleHomePath(role) {
  const normalized = normalizeRole(role);
  if (normalized === 'trainer') return '/trainer/hub';
  if (normalized === 'admin') return '/admin/system-hub';
  return '/customer/dashboard';
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
