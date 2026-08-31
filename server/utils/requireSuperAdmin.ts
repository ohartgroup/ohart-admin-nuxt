import type { H3Event } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

// 가입 승인 API들이 공통으로 쓰는 가드: 로그인 + admin_accounts.status=active + super_admin role 확인.
// 통과하면 호출자의 admin_account_id를 돌려준다(승인 처리 시 granted_by로 기록하려고).
export const requireSuperAdmin = async (event: H3Event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: account } = await client
    .schema('admin')
    .from('admin_accounts')
    .select('id, status, role_assignments!role_assignments_admin_account_id_fkey(role_type)')
    .eq('user_id', user.sub)
    .eq('role_assignments.deleted', false)
    .maybeSingle()

  const isSuperAdmin = account?.status === 'active'
    && account.role_assignments.some(r => r.role_type === 'super_admin')

  if (!isSuperAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'super_admin 권한이 필요합니다.' })
  }

  return { client, adminAccountId: account.id }
}
