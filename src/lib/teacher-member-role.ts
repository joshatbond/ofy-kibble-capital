/** Mirror of `convex/lib/roles.ts` — keep in sync for client route guards. */
export const TEACHER_MEMBER_ROLES = ['owner', 'admin', 'teacher'] as const

export function isTeacherMemberRole(role: string): boolean {
  return (TEACHER_MEMBER_ROLES as ReadonlyArray<string>).includes(role)
}
