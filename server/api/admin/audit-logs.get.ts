// public.users 조인은 스키마 경계 때문에 PostgREST 자동 임베딩이 불안정해서
// (다른 admin API들과 동일 이슈) 따로 조회해 JS에서 합친다.
// 최근 300건만 가져온다 — 로그가 계속 쌓이는 테이블이라 전체 조회는 나중에 페이지네이션/기간 필터로 바꿔야 함.
export default defineEventHandler(async (event) => {
  const { client } = await requireSuperAdmin(event)

  const { data: logs, error: logsError } = await client
    .schema('admin')
    .from('audit_logs')
    .select('id, admin_account_id, action, target_service_id, target_resource, ip_address, occurred_at')
    .order('occurred_at', { ascending: false })
    .limit(300)

  if (logsError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: logsError.message })
  }
  if (logs.length === 0) {
    return []
  }

  const { data: accounts, error: accountsError } = await client
    .schema('admin')
    .from('admin_accounts')
    .select('id, user_id')
    .in('id', logs.map(l => l.admin_account_id))

  if (accountsError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: accountsError.message })
  }

  // 감사로그는 "그 시점에 누가 했는지"를 영구 보존하는 게 목적이라 users/services에
  // deleted 필터를 걸지 않는다 — 계정이 나중에 삭제되거나 서비스가 없어져도 과거 로그에는
  // 여전히 실명/서비스명이 남아 있어야 한다(다른 조회들과 의도적으로 다른 정책).
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

  return logs.map((log) => {
    const account = accounts.find(a => a.id === log.admin_account_id)
    const user = account ? users.find(u => u.id === account.user_id) : null
    return {
      id: log.id,
      actorEmail: user?.email ?? null,
      actorDisplayName: user?.display_name ?? null,
      action: log.action,
      targetServiceName: services.find(s => s.id === log.target_service_id)?.name ?? null,
      targetResource: log.target_resource,
      ipAddress: log.ip_address,
      occurredAt: log.occurred_at,
    }
  })
})
