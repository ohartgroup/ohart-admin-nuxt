interface RevokeRoleBody {
  roleAssignmentId: string
}

export default defineEventHandler(async (event) => {
  const { client } = await requireSuperAdmin(event)

  const body = await readBody<RevokeRoleBody>(event)
  if (!body?.roleAssignmentId) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'roleAssignmentId는 필수입니다.' })
  }

  const { error } = await client
    .schema('admin')
    .from('role_assignments')
    .update({ deleted: true })
    .eq('id', body.roleAssignmentId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: error.message })
  }

  return { revoked: true }
})
