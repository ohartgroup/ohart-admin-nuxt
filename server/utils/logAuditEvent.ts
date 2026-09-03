import type { H3Event } from 'h3'
import type { serverSupabaseServiceRole } from '#supabase/server'
import type { Database, Json } from '~/types/database.types'

interface LogAuditEventParams {
  adminAccountId: string
  action: string
  // 특정 서비스에 종속된 작업이 아니면(super_admin의 교차-서비스 작업 등) 비워둔다 —
  // 화면(audit-logs.vue)에서 이런 경우 "통합관리자"로 표시한다.
  targetServiceId?: string | null
  targetResource?: Record<string, unknown> | null
}

// server/api 곳곳에서 admin.audit_logs에 직접 insert하던 걸 하나로 모은 유틸.
// 기존엔 audit-log.post.ts(클라이언트 호출용)만 ip_address를 채우고 있었고, 나머지
// 도메인 API들(performances/legal-documents/inquiries/contracts/documents 등)은
// ip_address를 아예 안 채우고 있었다 — 그 gap을 없애려고 만든 공통 경로.
export const logAuditEvent = async (
  event: H3Event,
  client: ReturnType<typeof serverSupabaseServiceRole<Database>>,
  params: LogAuditEventParams,
) => {
  const { error } = await client
    .schema('admin')
    .from('audit_logs')
    .insert({
      admin_account_id: params.adminAccountId,
      action: params.action,
      target_service_id: params.targetServiceId ?? null,
      target_resource: (params.targetResource ?? null) as Json,
      ip_address: getRequestIP(event, { xForwardedFor: true }) ?? null,
    })

  // 감사로그 기록 실패로 본 작업 자체를 실패시키지 않는다(이미 본 작업은 커밋된 뒤라 롤백 대상도
  // 아님) — 대신 서버 로그에 남겨서 나중에 확인할 수 있게 한다.
  if (error) {
    console.error('[logAuditEvent] failed to insert audit log', { action: params.action, error })
  }
}
