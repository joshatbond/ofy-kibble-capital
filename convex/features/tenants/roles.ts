/**
 * Classroom member roles (invitation + membership).
 * Co-teachers use the same `teacher` role; operator seed may use `owner`.
 */
export const APP_ROLES = {
  teacher: {
    organizations: ['read', 'update'],
    members: ['add', 'remove', 'updateRole', 'suspend', 'unsuspend', 'list'],
    teams: ['list'],
    invitations: ['create', 'list', 'cancel', 'resend'],
  },
  student: {
    organizations: ['read'],
    members: ['list'],
    invitations: ['list'],
  },
} as const
export const TEACHER_MEMBER_ROLES = ['owner', 'admin', 'teacher'] as const
export function isTeacherMemberRole(role: string): boolean {
  return (TEACHER_MEMBER_ROLES as ReadonlyArray<string>).includes(role)
}
export type AppRole = keyof typeof APP_ROLES
export type ClassroomMemberRole = 'owner' | 'admin' | 'member' | AppRole
