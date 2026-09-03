// public.users/public.services 조인은 스키마 경계 때문에 PostgREST 자동 임베딩이 불안정해서
// (pending-accounts.get.ts와 동일 이슈) 따로 조회해 JS에서 합친다.
// includeRevokedRoles=true면 회수된(deleted=true) role_assignments도 같이 내려준다 —
// permissions.vue의 "회수된 권한 보기" 토글용. 회수 자체는 여전히 soft delete만 한다.
export default defineEventHandler(async (event) => {
  const { client } = await requireSuperAdmin(event)
  const query = getQuery(event)
  const includeRevokedRoles = query.includeRevokedRoles === 'true'

  let accountQuery = client
    .schema('admin')
    .from('admin_accounts')
    .select('id, status, user_id, department:departments!admin_accounts_department_id_fkey(id, name), role_assignments!role_assignments_admin_account_id_fkey(id, role_type, service_id, deleted)')
    .eq('status', 'active')
    .eq('deleted', false)
    .order('created_at', { ascending: true })

  if (!includeRevokedRoles) {
    accountQuery = accountQuery.eq('role_assignments.deleted', false)
  }

  const { data: accounts, error: accountsError } = await accountQuery

  if (accountsError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: accountsError.message })
  }
  if (accounts.length === 0) {
    return []
  }

  const [{ data: users, error: usersError }, { data: services, error: servicesError }] = await Promise.all([
    client.from('users').select('id, email, display_name').in('id', accounts.map(a => a.user_id)).eq('deleted', false),
    client.from('services').select('id, name').eq('deleted', false),
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
      deleted: role.deleted,
    })),
  }))
})
