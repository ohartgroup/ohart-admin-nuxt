import type { H3Event } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

// /admins(관리자 관리) API가 쓰는 가드: 로그인 + active + (super_admin 또는 부서장) 확인.
// requireSuperAdmin보다 넓은 대신, 부서장이면 managedDepartmentIds로 자기 관리 부서만
// 내려주도록 호출부가 스코프를 좁혀야 한다(이 가드 자체는 "누가 뭘 볼 수 있는지"만 판단).
export const requireDepartmentManager = async (event: H3Event) => {
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
    .eq('deleted', false)
    .eq('role_assignments.deleted', false)
    .maybeSingle()

  if (account?.status !== 'active') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: '활성 관리자만 접근할 수 있습니다.' })
  }

  const isSuperAdmin = account.role_assignments.some(r => r.role_type === 'super_admin')

  const { data: managedDepartments } = await client
    .schema('admin')
    .from('departments')
    .select('id')
    .eq('manager_admin_account_id', account.id)
    .eq('deleted', false)

  const managedDepartmentIds = (managedDepartments ?? []).map(d => d.id)

  if (!isSuperAdmin && managedDepartmentIds.length === 0) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: '부서장 이상 권한이 필요합니다.' })
  }

  return { client, adminAccountId: account.id, isSuperAdmin, managedDepartmentIds }
}
