// slug 기반으로 "이 서비스에 대한 관리 권한이 있는지" 판단하는 공용 composable.
// role_assignments.service_id는 UUID라 slug와 직접 비교가 안 되므로 한 번 조회해서 매핑한다.
export const useServiceAccess = (slug: string) => {
  const supabase = useSupabaseClient()
  const { isSuperAdmin, account } = useAdminAuth()

  const serviceId = ref<string | undefined>(undefined)

  onMounted(async () => {
    const { data } = await supabase.from('services').select('id').eq('slug', slug).maybeSingle()
    serviceId.value = data?.id
  })

  const hasAccess = computed(() => {
    if (isSuperAdmin.value) {
      return true
    }
    if (!serviceId.value) {
      return false
    }
    return (account.value?.role_assignments ?? []).some(r => r.role_type === 'service_admin' && r.service_id === serviceId.value)
  })

  return { hasAccess }
}
