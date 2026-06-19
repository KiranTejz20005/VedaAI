export const ROUTE_PERMISSIONS = {
  SUPER_ADMIN: [
    '/dashboard',
    '/reviews',
    '/groups',
    '/assignments',
    '/assignments/create',
    '/question-bank',
    '/syllabus',
    '/settings',
    '/analytics'
  ],
  ADMIN: [
    '/dashboard',
    '/reviews',
    '/groups',
    '/assignments',
    '/assignments/create',
    '/question-bank',
    '/syllabus',
    '/settings',
    '/analytics'
  ],
  TEACHER: [
    '/dashboard',
    '/groups',
    '/assignments',
    '/assignments/create',
    '/question-bank',
    '/syllabus',
    '/settings'
  ],
  STUDENT: [
    '/dashboard',
    '/assignments',
    '/assessments',
    '/tutor',
    '/notes',
    '/settings'
  ]
};

export const canAccessRoute = (role: string, path: string): boolean => {
  if (!role) return false;
  const normalizedRole = role.toUpperCase();
  const allowedRoutes = ROUTE_PERMISSIONS[normalizedRole as keyof typeof ROUTE_PERMISSIONS] || [];

  // Exact matches or subdirectory matches
  return allowedRoutes.some(route => path === route || path.startsWith(`${route}/`));
};
