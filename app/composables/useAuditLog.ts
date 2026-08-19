// 관리자 조작(승인/거부/권한변경/데이터 수정 등)마다 호출하는 공통 유틸.
// 클라이언트가 admin.audit_logs에 직접 insert할 권한이 없으므로 반드시 server/api를 경유한다.
export const useAuditLog = () => {
  const log = async (action: string, options?: { targetServiceId?: string, targetResource?: Record<string, unknown> }) => {
    await $fetch('/api/admin/audit-log', {
      method: 'POST',
      body: {
        action,
        targetServiceId: options?.targetServiceId,
        targetResource: options?.targetResource,
      },
    })
  }

  return { log }
}
