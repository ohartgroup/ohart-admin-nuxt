interface GrantRoleBody {
  adminAccountId: string
  roleType: 'super_admin' | 'service_admin' | 'settlement_viewer'
  serviceId?: string
}

export default defineEventHandler(async (event) => {
  const { client, adminAccountId: grantedBy } = await requireSuperAdmin(event)

  const body = await readBody<GrantRoleBody>(event)
  if (!body?.adminAccountId || !body?.roleType) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'adminAccountId, roleType는 필수입니다.' })
  }

  const { error } = await client
    .schema('admin')
    .from('role_assignments')
    .insert({
      admin_account_id: body.adminAccountId,
      role_type: body.roleType,
      service_id: body.roleType === 'super_admin' ? null : (body.serviceId ?? null),
      granted_by: grantedBy,
    })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: error.message })
  }

  return { granted: true }
})
