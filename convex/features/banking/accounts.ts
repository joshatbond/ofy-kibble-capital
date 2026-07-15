import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'
import type { bankAccountKindValidator } from '../../schema/schemaFields'
import type { Infer } from 'convex/values'

export async function getBankAccountForStudent(
  ctx: QueryCtx | MutationCtx,
  rosterStudentId: Id<'rosterStudents'>,
  kind: BankAccountKind
): Promise<Doc<'bankAccounts'> | null> {
  return await ctx.db
    .query('bankAccounts')
    .withIndex('by_rosterStudent_kind', q =>
      q.eq('rosterStudentId', rosterStudentId).eq('kind', kind)
    )
    .unique()
}
export async function requireBankAccountForStudent(
  ctx: QueryCtx | MutationCtx,
  rosterStudentId: Id<'rosterStudents'>,
  kind: BankAccountKind
): Promise<Doc<'bankAccounts'>> {
  const account = await getBankAccountForStudent(ctx, rosterStudentId, kind)

  if (account === null) {
    throw new Error(`${kind} account not found for this student.`)
  }

  return account
}
type BankAccountKind = Infer<typeof bankAccountKindValidator>
