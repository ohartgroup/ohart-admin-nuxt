// 공연작품 관리처럼 특정 서비스 하나가 아니라 여러 서비스를 가로지르는 화면의 메뉴 노출 조건.
// useServiceAccess(slug)는 서비스 하나만 체크하지만, 이건 "service_admin으로 배정된 서비스가
// 하나라도 있으면" 노출 — 새 서비스(artschool 등)가 등록돼도 하드코딩 없이 자동으로 커버된다.
export const useCatalogAccess = () => {
  const { isSuperAdmin, account } = useAdminAuth()

  const hasAccess = computed(() => {
    if (isSuperAdmin.value) {
      return true
    }
    return (account.value?.role_assignments ?? []).some(r => r.role_type === 'service_admin' && r.service_id)
  })

  return { hasAccess }
}
