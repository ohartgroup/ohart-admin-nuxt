import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database, Json } from '~/types/database.types'

interface AuditLogBody {
  action: string
  targetServiceId?: string
  targetResource?: Record<string, unknown>
}

// 클라이언트는 admin.audit_logs에 직접 insert할 권한이 없다(RLS: super_admin만 select, insert 정책 없음).
// service role로 검증된 admin_account_id를 붙여 기록한다.
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<AuditLogBody>(event)
  if (!body?.action) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'action is required' })
  }

  const client = serverSupabaseServiceRole<Database>(event)

  const { data: account } = await client
    .schema('admin')
    .from('admin_accounts')
    .select('id')
    .eq('user_id', user.sub)
    .maybeSingle()

  if (!account) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'admin account not found' })
  }

  const { error } = await client
    .schema('admin')
    .from('audit_logs')
    .insert({
      admin_account_id: account.id,
      action: body.action,
      target_service_id: body.targetServiceId,
      target_resource: (body.targetResource ?? null) as Json,
      ip_address: getRequestIP(event, { xForwardedFor: true }) ?? null,
    })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: error.message })
  }

  return { logged: true }
})
