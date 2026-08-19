import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

// 매직링크 로그인 직후 최초 1회 호출된다.
// 이메일 도메인이 admin.allowed_email_domains에 없으면 거부하고,
// 있으면 admin.admin_accounts를 status='pending'으로 기본값 생성한다(RLS 우회 위해 service role 사용).
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.email) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const domain = user.email.split('@')[1]?.toLowerCase()
  if (!domain) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = serverSupabaseServiceRole<Database>(event)

  const { data: allowedDomain, error: domainError } = await client
    .schema('admin')
    .from('allowed_email_domains')
    .select('id')
    .eq('domain', domain)
    .eq('active', true)
    .eq('deleted', false)
    .maybeSingle()

  if (domainError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: domainError.message })
  }
  if (!allowedDomain) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: `허용되지 않은 이메일 도메인입니다: ${domain}` })
  }

  const { data: existing } = await client
    .schema('admin')
    .from('admin_accounts')
    .select('id')
    .eq('user_id', user.sub)
    .maybeSingle()

  if (existing) {
    return { created: false }
  }

  const { error } = await client
    .schema('admin')
    .from('admin_accounts')
    .insert({ user_id: user.sub })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: error.message })
  }

  return { created: true }
})
