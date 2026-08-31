// public.users/public.services 조인은 스키마 경계 때문에 PostgREST 자동 임베딩이 불안정해서
// (pending-accounts.get.ts와 동일 이슈) 따로 조회해 JS에서 합친다.
export default defineEventHandler(async (event) => {
  const { client } = await requireSuperAdmin(event)

  const { data: accounts, error: accountsError } = await client
    .schema('admin')
    .from('admin_accounts')
    .select('id, status, user_id, department:departments!admin_accounts_department_id_fkey(id, name), role_assignments!role_assignments_admin_account_id_fkey(id, role_type, service_id)')
    .eq('status', 'active')
    .eq('role_assignments.deleted', false)
    .order('created_at', { ascending: true })

  if (accountsError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: accountsError.message })
  }
  if (accounts.length === 0) {
    return []
  }

  const [{ data: users, error: usersError }, { data: services, error: servicesError }] = await Promise.all([
    client.from('users').select('id, email, display_name').in('id', accounts.map(a => a.user_id)),
    client.from('services').select('id, name'),
  ])

  if (usersError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: usersError.message })
  }
  if (servicesError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: servicesError.message })
  }

  return accounts.map(account => ({
    id: account.id,
    user: users.find(u => u.id === account.user_id) ?? null,
    department: account.department,
    roleAssignments: account.role_assignments.map(role => ({
      id: role.id,
      roleType: role.role_type,
      serviceId: role.service_id,
      serviceName: services.find(s => s.id === role.service_id)?.name ?? null,
    })),
  }))
})
