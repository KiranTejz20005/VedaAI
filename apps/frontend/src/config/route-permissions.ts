/** Routes explicitly allowed per role. Sub-path access uses prefix matching except where denied. */
export const ROUTE_PERMISSIONS = {
  SUPER_ADMIN: [
    '/dashboard/super-admin',
    '/dashboard/admin',
    '/dashboard/faculty',
    '/dashboard/teacher',
    '/dashboard/student',
    // Fallback routes
    '/dashboard', '/assignments', '/assignments/create', '/settings', '/admin', '/generate', '/ai-toolkit', '/grader', '/my-classes', '/papers', '/profile', '/student',
  ],
  ADMIN: [
    '/dashboard/admin',
    '/dashboard/faculty',
    '/dashboard/teacher',
    '/dashboard/student',
    '/dashboard', '/assignments', '/assignments/create', '/settings', '/generate', '/ai-toolkit', '/grader', '/my-classes', '/papers', '/profile', '/admin',
  ],
  ORG_ADMIN: [
    '/dashboard/admin',
    '/dashboard/faculty',
    '/dashboard/teacher',
    '/dashboard/student',
    '/dashboard', '/assignments', '/assignments/create', '/settings', '/generate', '/ai-toolkit', '/grader', '/my-classes', '/papers', '/profile', '/admin',
  ],
  FACULTY: [
    '/dashboard/faculty',
    '/dashboard/teacher',
    '/dashboard/student',
    '/assignments', '/assignments/create', '/settings', '/generate', '/ai-toolkit', '/grader', '/my-classes', '/papers', '/profile',
  ],
  TEACHER: [
    '/dashboard/teacher',
    '/dashboard/student',
    '/assignments', '/assignments/create', '/settings', '/generate', '/ai-toolkit', '/grader', '/my-classes', '/papers', '/profile',
  ],
  STUDENT: [
    '/dashboard/student',
    '/settings', '/student', '/profile',
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

];

export const canAccessRoute = (role: string, path: string): boolean => {
  if (!role) return false;
  const normalizedRole = role.toUpperCase();

  if (normalizedRole === 'SUPER_ADMIN') return true;

  const isSuperAdminRoute = path === '/super-admin' || path.startsWith('/super-admin/') || path === '/dashboard/super-admin' || path.startsWith('/dashboard/super-admin/');
  if (isSuperAdminRoute) {
    return false; // Already checked for SUPER_ADMIN above
  }

  if (normalizedRole === 'STUDENT') {
    if (STUDENT_DENIED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return false;
    }
  }

  const allowedRoutes = ROUTE_PERMISSIONS[normalizedRole as keyof typeof ROUTE_PERMISSIONS] || [];

  return allowedRoutes.some((route) => path === route || path.startsWith(`${route}/`));
};
