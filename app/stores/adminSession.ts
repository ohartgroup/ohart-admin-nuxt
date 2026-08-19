import { defineStore } from 'pinia'
import type { Database } from '~/types/database.types'

type AdminAccountRow = Database['admin']['Tables']['admin_accounts']['Row']
type RoleAssignmentRow = Database['admin']['Tables']['role_assignments']['Row']
type DepartmentRow = Database['admin']['Tables']['departments']['Row']

export interface AdminAccountWithRelations extends AdminAccountRow {
  department: DepartmentRow | null
  role_assignments: RoleAssignmentRow[]
}

export const useAdminSessionStore = defineStore('adminSession', () => {
  const account = ref<AdminAccountWithRelations | null>(null)
  const loading = ref(false)
  const loaded = ref(false)

  const roles = computed(() => account.value?.role_assignments ?? [])
  const isSuperAdmin = computed(() => roles.value.some(r => r.role_type === 'super_admin'))
  const isActive = computed(() => account.value?.status === 'active')

  const fetch = async () => {
    const user = useSupabaseUser()
    if (!user.value) {
      account.value = null
      loaded.value = true
      return
    }

    const supabase = useSupabaseClient<Database>()
    loading.value = true
    const { data } = await supabase
      .schema('admin')
      .from('admin_accounts')
      .select('*, department:departments(*), role_assignments(*)')
      .eq('user_id', user.value.sub as string)
      .maybeSingle()

    account.value = data as AdminAccountWithRelations | null
    loading.value = false
    loaded.value = true
  }

  // admin_accounts row가 없으면(최초 매직링크 로그인) signup-check API로 pending 계정을 만든다.
  // 실패(허용되지 않은 도메인 등)는 여기서 삼키지 않고 그대로 던진다 — 호출부(미들웨어)가 처리한다.
  const ensureAccount = async () => {
    if (!loaded.value) {
      await fetch()
    }
    if (account.value) {
      return account.value
    }
    await $fetch('/api/admin/signup-check', { method: 'POST' })
    await fetch()
    return account.value
  }

  const reset = () => {
    account.value = null
    loaded.value = false
  }

  return { account, loading, loaded, roles, isSuperAdmin, isActive, fetch, ensureAccount, reset }
})
