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

export type AppRole = keyof typeof APP_ROLES

export type ClassroomMemberRole = 'owner' | 'admin' | 'member' | AppRole
