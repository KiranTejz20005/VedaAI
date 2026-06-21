# LMS End-to-End Audit Report

**Date:** 2026-06-21  
**Scope:** Assignment management, RBAC, tenant isolation, workflow integrity  
**Hierarchy:** Super Admin → Admin → Faculty → Student

---

## 1. Architecture Review

### Platform layers

| Layer | Technology | Enforcement |
|-------|------------|-------------|
| Database | PostgreSQL + Prisma | `organizationId`, `createdById`, FK constraints |
| Backend | Express + JWT | `authenticate`, `requireOrganizationScope`, `requirePermission`, `requireRole` |
| Services | assignment-access module | Org scope, ownership, enrollment checks |
| Frontend | Next.js App Router | Client-side route guards (UX only; backend is authoritative) |

### Data model (assignment domain)

- **Assignment** — org-scoped; optional `createdById` (faculty owner), optional `classId`
- **GeneratedPaper** — org-scoped via `organizationId`
- **StudentSubmission** — FK to Assignment; unique `[assignmentId, studentId]`; org-scoped
- **No separate Course model** — use `Class`, `Classroom`/`Section`/`Enrollment`, or `Syllabus`

### Dual RBAC note

Runtime guards use `SystemRole` + static `ROLE_PERMISSIONS` (`apps/backend/src/security/roles.ts`). DB `Role`/`Permission`/`UserRole` tables from seed are **not** used at request time.

---

## 2. RBAC Audit Report

### Role permissions (enforced backend)

| Role | Assignment create | Generate paper | Approve/publish | Grade | Submit (student) |
|------|-------------------|----------------|-----------------|-------|------------------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ❌ |
| ADMIN | ❌ | ❌ (view only) | ✅ | ❌ | ❌ |
| TEACHER / FACULTY | ✅ (own) | ✅ (own) | ❌ | ✅ (own) | ❌ |
| STUDENT | ❌ | ❌ | ❌ | ❌ | ✅ |

### Fixes implemented

| Issue | Fix |
|-------|-----|
| FACULTY role missing from `ROLE_PERMISSIONS` | Added FACULTY alias; `hasPermission` normalizes FACULTY → TEACHER |
| Student routes had no role guard | `requireRole('STUDENT')` on all `/student/*` routes |
| Paper routes unauthenticated | Auth + `VIEW_PAPER` / `EDIT_ASSIGNMENT` + org scoping |
| Grader routes cross-tenant | Org-scoped submission queries; ownership via `assertCanGradeAssignment` |
| Admin assignment CRUD global | Org filter on list/mutate; SUPER_ADMIN may query all |
| Mock auth in production | Mock only when `NODE_ENV !== 'production'` AND (`test` OR `development` OR `ENABLE_MOCK_AUTH`) |
| Invalid JWT bypassing to mock user | Removed — invalid tokens always 401 |

### Frontend route guards

- **Students** denied `/assignments`, `/grader`, `/papers`, `/admin`, etc. via `STUDENT_DENIED_PREFIXES`
- **Faculty** granted `/papers` (was blocked before)
- **Assessments workflow** calls `/assignments/:id/submit|approve|reject|publish` (was broken `/assessments/:id/...`)
- **Mobile nav** role-aware; create FAB hidden for students
- **AppShell** — SUPER_ADMIN → AdminSidebar; ADMIN/ORG_ADMIN → OrgAdminSidebar; TEACHER/FACULTY → FacultySidebar; STUDENT → StudentSidebar

---

## 3. Assignment Workflow Audit

### Lifecycle (faculty → student)

```
DRAFT → GENERATING → GENERATED → PENDING_APPROVAL → APPROVED → PUBLISHED → ACTIVE
                              ↘ REJECTED
```

| Step | Backend | Status |
|------|---------|--------|
| 1. Faculty creates assignment | POST `/assignments` + `CREATE_ASSIGNMENT` + org scope + `createdById` | ✅ Fixed |
| 2. Linked to course (optional) | `classId` field on Assignment | ✅ Schema added |
| 3. Stored with org + owner | Prisma create with `organizationId`, `createdById` | ✅ Fixed |
| 4. Visible to enrolled students | Published + org enrollment check | ✅ Fixed |
| 5. Draft hidden from students | `assertStudentCanViewAssignment` checks status | ✅ Fixed |
| 6. Published visible | Status in `PUBLISHED`, `ACTIVE`, `COMPLETED` | ✅ |
| 7. Student starts attempt | POST `/student/assessments/:id/start` | ✅ Added |
| 8. Student submits | POST `/student/assessments/:id/submit` + `SUBMIT_ASSESSMENT` | ✅ Moved from grader |
| 9. Faculty grades | `/grader/*` with ownership + org scope | ✅ Fixed |
| 10. Student sees grade | GET `/student/results`, `/student/results/:id` | ✅ Added |
| 11. Analytics | Partial — org-scoped dashboards exist; assignment analytics need class linkage for full accuracy | ⚠️ Partial |

### Ownership rules

- Faculty may only modify/delete/grade assignments they **created** (`createdById`)
- Legacy assignments without `createdById` remain editable by any faculty in the org
- Admins and Super Admins bypass ownership

---

## 4. Security Findings & Fixes

### Critical (fixed)

| Finding | Fix file(s) |
|---------|-------------|
| Unauthenticated paper API (IDOR) | `paper.routes.ts`, `paper.controller.ts` |
| Cross-tenant admin assignment ops | `admin.controller.ts` |
| Grader submission exposure | `grader.controller.ts`, `assignment-access.ts` |
| Student submission on wrong route (GRADE permission) | `student.routes.ts`, `student.controller.ts` |

### High (fixed)

| Finding | Fix |
|---------|-----|
| `requireOwnership` flag never consumed | Controllers now call `assertFacultyOwnsAssignment` |
| `enqueueGeneration` no org check | Filters by `organizationId` |
| FACULTY 403 on all assignment APIs | FACULTY in `ROLE_PERMISSIONS` |
| Student could reach faculty UI routes | Frontend deny-list + backend permission checks |

### Remaining recommendations (not blocking)

| Item | Priority |
|------|----------|
| Wire `classId` on assignment create UI | Medium |
| Full enrollment-to-assignment mapping (class-specific visibility) | Medium |
| Admin user CRUD IDOR by user ID | High — needs same org-scope pattern as assignments |
| Audit logs global for admin | Medium |
| Next.js middleware for server-side route blocking | Low (backend is authoritative) |
| DB Role/Permission tables vs SystemRole — consolidate or remove | Low |

---

## 5. Database Changes

```prisma
model Assignment {
  createdById  String?
  createdBy    User?   @relation("AssignmentCreator", ...)
  classId      String?
  class        Class?  @relation(...)
  submissions  StudentSubmission[]
}

model StudentSubmission {
  assignment   Assignment @relation(...)
  @@unique([assignmentId, studentId])
}
```

**Migration required:** Run `npx prisma migrate dev` against your database before deploying.

---

## 6. API Changes Summary

### Secured endpoints

- `GET/PUT/POST /papers/*` — now require auth + permissions
- `GET/POST /grader/*` — faculty/admin only; org + ownership
- `GET/POST /student/*` — STUDENT role only

### New student endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/student/stats` | Dashboard stats |
| GET | `/student/assessments/upcoming` | Upcoming published assessments |
| POST | `/student/assessments/:id/start` | Start/resume attempt |
| POST | `/student/assessments/:id/submit` | Submit file |
| GET | `/student/results/:id` | Single result detail |

---

## 7. Frontend Fixes

| File | Change |
|------|--------|
| `route-permissions.ts` | Student deny-list; `/papers` for faculty; ORG_ADMIN routes |
| `assessments/page.tsx` | Workflow actions → `/assignments/:id/{submit,approve,...}` |
| `MobileBottomNav.tsx` | Role-specific nav; no create FAB for students |
| `AppShell.tsx` | OrgAdminSidebar for ADMIN/ORG_ADMIN |
| `assignments/create/page.tsx` | Validate before submit; lightweight creating overlay (not GenerationScreen) |

---

## 8. Tests & Results

### Test file

`apps/backend/src/__tests__/rbac-access.test.ts`

### Coverage

- Role permission matrix (SUPER_ADMIN, ADMIN, TEACHER, FACULTY, STUDENT)
- FACULTY → TEACHER normalization
- Assignment ownership (creator, other faculty, admin bypass, legacy null owner)

### Run results

```
Test Files  9 passed (9)
Tests       42 passed (42)
TypeScript  tsc --noEmit ✅
Prisma      prisma generate ✅
```

---

## 9. Files Changed (this audit)

### Backend — new

- `src/security/request-context.ts`
- `src/security/role.middleware.ts`
- `src/security/assignment-access.ts`
- `src/__tests__/rbac-access.test.ts`

### Backend — modified

- `prisma/schema.prisma`
- `src/security/roles.ts`
- `src/middlewares/auth.middleware.ts`
- `src/services/assignment.service.ts`
- `src/controllers/assignment.controller.ts`
- `src/controllers/paper.controller.ts`
- `src/controllers/grader.controller.ts`
- `src/controllers/student.controller.ts`
- `src/controllers/admin.controller.ts`
- `src/routes/paper.routes.ts`
- `src/routes/grader.routes.ts`
- `src/routes/student.routes.ts`

### Frontend — modified

- `src/config/route-permissions.ts`
- `src/app/assessments/page.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/MobileBottomNav.tsx`
- `src/app/assignments/create/page.tsx`

---

## 10. Deployment Checklist

1. Run database migration for `createdById`, `classId`, submission FK/unique constraint
2. Set `ENABLE_MOCK_AUTH=false` in production
3. Verify JWT includes `activeOrganizationId` after org switch
4. Smoke-test: faculty create → generate → approve → publish → student submit → faculty grade → student result
5. Negative test: student GET `/assignments` → 403; unauthenticated GET `/papers/:id` → 401

---

*Report generated as part of comprehensive LMS security and workflow audit.*
