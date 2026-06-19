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
    '/analytics',
    '/admin',
    '/lessons',
    '/assessments',
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
    '/analytics',
    '/lessons',
    '/assessments',
  ],
  TEACHER: [
    '/dashboard',
    '/groups',
    '/assignments',
    '/assignments/create',
    '/question-bank',
    '/syllabus',
    '/settings',
    '/lessons',
    '/assessments',
  ],
  STUDENT: [
    '/dashboard',
    '/assignments',
    '/assessments',
    '/tutor',
    '/notes',
    '/settings',
    '/student',
    '/lessons',
  ]
};

export const canAccessRoute = (role: string, path: string): boolean => {
  if (!role) return false;
  const normalizedRole = role.toUpperCase();

  // Super admin can access everything
  if (normalizedRole === 'SUPER_ADMIN') return true;

  const allowedRoutes = ROUTE_PERMISSIONS[normalizedRole as keyof typeof ROUTE_PERMISSIONS] || [];

  // Exact matches or subdirectory matches
  return allowedRoutes.some(route => path === route || path.startsWith(`${route}/`));
};
