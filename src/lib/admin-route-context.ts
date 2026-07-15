import type { Id } from '~/convex/_generated/dataModel'

export function isScopedAdminPath(pathname: string): boolean {
  return /^\/admin\/[^/]+/.test(pathname) && pathname !== '/admin/landing'
}

export function teacherContextQueryArgs(params: { orgSlug?: string }) {
  if (params.orgSlug === undefined) {
    return {}
  }

  return { orgSlug: params.orgSlug }
}

export function classroomSelectValue(classroom: {
  orgSlug: string
  organizationId: string
  classroomId: Id<'classrooms'>
}): string {
  return classroom.orgSlug
}
