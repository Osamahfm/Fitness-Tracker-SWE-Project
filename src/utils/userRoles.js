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
