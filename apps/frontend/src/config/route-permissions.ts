/** Routes explicitly allowed per role. Sub-path access uses prefix matching except where denied. */
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
    '/generate',
    '/grader',
    '/classes',
    '/papers',
    '/profile',
    '/student',
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
    '/generate',
    '/grader',
    '/classes',
    '/papers',
    '/profile',
    '/admin',
  ],
  ORG_ADMIN: [
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
    '/generate',
    '/grader',
    '/classes',
    '/papers',
    '/profile',
    '/admin',
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
    '/generate',
    '/grader',
    '/classes',
    '/papers',
    '/profile',
  ],
  FACULTY: [
    '/dashboard',
    '/groups',
    '/assignments',
    '/assignments/create',
    '/question-bank',
    '/syllabus',
    '/settings',
    '/lessons',
    '/assessments',
    '/generate',
    '/grader',
    '/classes',
    '/papers',
    '/profile',
  ],
  STUDENT: [
    '/dashboard',
    '/tutor',
    '/notes',
    '/settings',
    '/student',
    '/profile',
  ],
};

const STUDENT_DENIED_PREFIXES = [
  '/assignments',
  '/assessments',
  '/grader',
  '/generate',
  '/papers',
  '/admin',
  '/reviews',
  '/analytics',
  '/classes',
  '/groups',
  '/question-bank',
  '/syllabus',
  '/lessons',
];

export const canAccessRoute = (role: string, path: string): boolean => {
  if (!role) return false;
  const normalizedRole = role.toUpperCase();

  if (normalizedRole === 'SUPER_ADMIN') return true;

  if (normalizedRole === 'STUDENT') {
    if (STUDENT_DENIED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return false;
    }
  }

  const allowedRoutes = ROUTE_PERMISSIONS[normalizedRole as keyof typeof ROUTE_PERMISSIONS] || [];

  return allowedRoutes.some((route) => path === route || path.startsWith(`${route}/`));
};
