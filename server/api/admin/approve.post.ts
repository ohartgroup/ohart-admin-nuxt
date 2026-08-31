interface ApproveBody {
  adminAccountId: string
  roleType: 'super_admin' | 'service_admin' | 'settlement_viewer'
  departmentId?: string
}

export default defineEventHandler(async (event) => {
  const { client, adminAccountId: grantedBy } = await requireSuperAdmin(event)

  const body = await readBody<ApproveBody>(event)
  if (!body?.adminAccountId || !body?.roleType) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'adminAccountId, roleType는 필수입니다.' })
  }

  const { error: updateError } = await client
    .schema('admin')
    .from('admin_accounts')
    .update({ status: 'active', department_id: body.departmentId ?? null })
    .eq('id', body.adminAccountId)

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: updateError.message })
  }

  const { error: roleError } = await client
    .schema('admin')
    .from('role_assignments')
    .insert({ admin_account_id: body.adminAccountId, role_type: body.roleType, granted_by: grantedBy })

  if (roleError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: roleError.message })
  }

  return { approved: true }
})
