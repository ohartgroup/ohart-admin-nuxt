// service_id 기준으로 role_assignments를 그룹핑해 AppSidebar/ServiceSwitcher가 온보딩된 서비스 메뉴를 렌더할 때 쓴다.
// 아직 artboda/artschool이 온보딩되지 않아 항상 빈 배열이며, 온보딩 시 이 composable에 서비스 항목 매핑을 추가한다.
export const useRoleAssignments = () => {
  const { account } = useAdminAuth()

  const roleAssignments = computed(() => account.value?.role_assignments ?? [])
  const serviceIds = computed(() =>
    [...new Set(roleAssignments.value.map(r => r.service_id).filter((id): id is string => !!id))],
  )

  return {
    roleAssignments,
    serviceIds,
    hasAnyService: computed(() => serviceIds.value.length > 0),
  }
}
