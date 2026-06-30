import type { Id } from '~/convex/_generated/dataModel'

export function isScopedAdminPath(pathname: string): boolean {
  return /^\/admin\/[^/]+/.test(pathname)
}

export function teacherContextQueryArgs(params: {
  orgId?: string
  classId?: string
}) {
  if (params.orgId === undefined) {
    return {}
  }

  return {
    organizationId: params.orgId,
    ...(params.classId !== undefined
      ? { classroomId: params.classId as Id<'classrooms'> }
      : {}),
  }
}
