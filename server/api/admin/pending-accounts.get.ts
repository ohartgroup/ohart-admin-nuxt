// admin_accounts(admin 스키마)와 users(public 스키마) 간 PostgREST 임베딩이 스키마 경계 때문에
// 불안정해서(게다가 user_id/update_user_id 이중 FK까지 있음), 두 번 조회해서 JS에서 합친다.
export default defineEventHandler(async (event) => {
  const { client } = await requireSuperAdmin(event)

  const { data: accounts, error: accountsError } = await client
    .schema('admin')
    .from('admin_accounts')
    .select('id, status, created_at, user_id')
    .in('status', ['pending', 'suspended'])
    .eq('deleted', false)
    .order('created_at', { ascending: true })

  if (accountsError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: accountsError.message })
  }
  if (accounts.length === 0) {
    return []
  }

  const { data: users, error: usersError } = await client
    .from('users')
    .select('id, email, display_name')
    .in('id', accounts.map(a => a.user_id))
    .eq('deleted', false)

  if (usersError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: usersError.message })
  }

  return accounts.map(account => ({
    id: account.id,
    status: account.status,
    created_at: account.created_at,
    user: users.find(u => u.id === account.user_id) ?? null,
  }))
})
