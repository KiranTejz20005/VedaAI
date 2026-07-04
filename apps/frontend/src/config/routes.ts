export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  FACULTY = 'FACULTY',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export const ROUTES = {
  SUPER_ADMIN: {
    DASHBOARD: '/dashboard/super-admin',
    SYSTEM_HEALTH: '/dashboard/super-admin/system-health',
    PROVIDERS: '/dashboard/super-admin/providers',
    KNOWLEDGE_BASE: '/dashboard/super-admin/knowledge',
    USERS: '/dashboard/super-admin/users',
    ORGANIZATIONS: '/dashboard/super-admin/organizations',
    SETTINGS: '/dashboard/super-admin/settings',
    AUDIT: '/dashboard/super-admin/audit',
    ANALYTICS: '/dashboard/super-admin/analytics'
  },
  ORG_ADMIN: {
    DASHBOARD: '/dashboard/admin',
    USERS: '/dashboard/admin/users',
    CLASSES: '/dashboard/admin/classes',
    APPROVALS: '/dashboard/admin/approvals',
    ANALYTICS: '/dashboard/admin/analytics',
    SETTINGS: '/dashboard/admin/settings'
  },
  FACULTY: {
    DASHBOARD: '/dashboard/faculty'
  },
  TEACHER: {
    DASHBOARD: '/dashboard/teacher'
  },
  STUDENT: {
    DASHBOARD: '/dashboard/student'
  }
} as const;
