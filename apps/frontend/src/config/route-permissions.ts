/** Routes explicitly allowed per role. Sub-path access uses prefix matching except where denied. */
export const ROUTE_PERMISSIONS = {
  SUPER_ADMIN: [
    '/dashboard/super-admin',
    '/dashboard/admin',
    '/dashboard/faculty',
    '/dashboard/teacher',
    '/dashboard/student',
    // Fallback/Legacy routes to avoid breaking changes immediately
    '/dashboard', '/reviews', '/groups', '/assignments', '/assignments/create', '/question-bank', '/syllabus', '/settings', '/analytics', '/admin', '/lessons', '/assessments', '/generate', '/grader', '/classes', '/my-classes', '/papers', '/profile', '/student',
  ],
  ADMIN: [
    '/dashboard/admin',
    '/dashboard/faculty',
    '/dashboard/teacher',
    '/dashboard/student',
    '/dashboard', '/reviews', '/groups', '/assignments', '/assignments/create', '/question-bank', '/syllabus', '/settings', '/analytics', '/lessons', '/assessments', '/generate', '/grader', '/classes', '/my-classes', '/papers', '/profile', '/admin',
  ],
  ORG_ADMIN: [
    '/dashboard/admin',
    '/dashboard/faculty',
    '/dashboard/teacher',
    '/dashboard/student',
    '/dashboard', '/reviews', '/groups', '/assignments', '/assignments/create', '/question-bank', '/syllabus', '/settings', '/analytics', '/lessons', '/assessments', '/generate', '/grader', '/classes', '/my-classes', '/papers', '/profile', '/admin',
  ],
  FACULTY: [
    '/dashboard/faculty',
    '/dashboard/teacher',
    '/dashboard/student',
    '/groups', '/assignments', '/assignments/create', '/question-bank', '/syllabus', '/settings', '/lessons', '/assessments', '/generate', '/grader', '/classes', '/my-classes', '/papers', '/profile', '/analytics',
  ],
  TEACHER: [
    '/dashboard/teacher',
    '/dashboard/student',
    '/groups', '/assignments', '/assignments/create', '/question-bank', '/syllabus', '/settings', '/lessons', '/assessments', '/generate', '/grader', '/classes', '/my-classes', '/papers', '/profile', '/analytics',
  ],
  STUDENT: [
    '/dashboard/student',
    '/tutor', '/notes', '/settings', '/student', '/profile', '/assignments',
  ],
};

const STUDENT_DENIED_PREFIXES = [
  '/dashboard/teacher',
  '/dashboard/faculty',
  '/dashboard/admin',
  '/dashboard/super-admin',
  '/assignments/create',
  '/assessments/create',
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
