import type { H3Event } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

// 공연작품 관리처럼 특정 서비스 하나에 종속되지 않고 여러 서비스를 가로지르는 API가 쓰는 가드.
// requireServiceAdmin(slug 하나)과 달리, 호출자가 service_admin으로 배정된 서비스 id 목록을
// 그대로 돌려줘서 목록 조회 스코프 필터링에 쓸 수 있게 한다. super_admin은 스코프 제한 없음.
export const requireCatalogAdmin = async (event: H3Event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: account } = await client
    .schema('admin')
    .from('admin_accounts')
    .select('id, status, role_assignments!role_assignments_admin_account_id_fkey(role_type, service_id)')
    .eq('user_id', user.sub)
    .eq('role_assignments.deleted', false)
    .maybeSingle()

  if (account?.status !== 'active') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const isSuperAdmin = account.role_assignments.some(r => r.role_type === 'super_admin')
  const serviceIds = account.role_assignments
    .filter((r): r is typeof r & { service_id: string } => r.role_type === 'service_admin' && r.service_id !== null)
    .map(r => r.service_id)

  if (!isSuperAdmin && serviceIds.length === 0) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: '공연작품 관리 권한이 필요합니다.' })
  }

  return { client, adminAccountId: account.id, isSuperAdmin, serviceIds }
}
