import type { H3Event } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

// artboda 등 서비스 모듈 API가 쓰는 가드: 로그인 + active + (super_admin 또는 해당 서비스 service_admin).
export const requireServiceAdmin = async (event: H3Event, serviceSlug: string) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: service } = await client.from('services').select('id').eq('slug', serviceSlug).eq('deleted', false).maybeSingle()

  const { data: account } = await client
    .schema('admin')
    .from('admin_accounts')
    .select('id, status, role_assignments!role_assignments_admin_account_id_fkey(role_type, service_id)')
    .eq('user_id', user.sub)
    .eq('deleted', false)
    .eq('role_assignments.deleted', false)
    .maybeSingle()

  const isAuthorized = account?.status === 'active' && account.role_assignments.some(r =>
    r.role_type === 'super_admin' || (r.role_type === 'service_admin' && r.service_id === service?.id),
  )

  if (!isAuthorized) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: `${serviceSlug} service_admin 권한이 필요합니다.` })
  }

  // 감사로그 target_service_id로 그대로 쓸 수 있게 호출부에 돌려준다(매번 재조회하지 않도록).
  return { client, adminAccountId: account.id, serviceId: service?.id ?? null }
}
