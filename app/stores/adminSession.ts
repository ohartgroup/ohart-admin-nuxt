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
  const managedDepartmentIds = ref<string[]>([])

  const roles = computed(() => account.value?.role_assignments ?? [])
  const isSuperAdmin = computed(() => roles.value.some(r => r.role_type === 'super_admin'))
  const isActive = computed(() => account.value?.status === 'active')
  const isDepartmentHead = computed(() => managedDepartmentIds.value.length > 0)

  const fetch = async () => {
    const user = useSupabaseUser()
    if (!user.value) {
      account.value = null
      loaded.value = true
      return
    }

    const supabase = useSupabaseClient<Database>()
    loading.value = true
    // role_assignments는 admin_accounts를 두 번 참조하고(admin_account_id, granted_by),
    // admin_accounts↔departments도 이제 양방향 FK(department_id, departments.manager_admin_account_id)라
    // PostgREST 자동 임베딩이 어떤 FK를 쓸지 못 정해서 에러 난다 — 둘 다 FK 이름으로 명시해야 한다.
    const { data, error } = await supabase
      .schema('admin')
      .from('admin_accounts')
      .select('*, department:departments!admin_accounts_department_id_fkey(*), role_assignments!role_assignments_admin_account_id_fkey(*)')
      .eq('user_id', user.value.sub as string)
      .eq('deleted', false)
      .eq('role_assignments.deleted', false)
      .maybeSingle()

    if (error) {
      console.error('[adminSession] fetch failed', error)
    }
    account.value = data as AdminAccountWithRelations | null
    loading.value = false
    loaded.value = true

    await fetchManagedDepartments(supabase)
  }

  // supabase 클라이언트를 인자로 받는다 — useSupabaseClient()를 await 이후(fetch() 내부)에서
  // 다시 호출하면 "composable called outside setup" 에러가 난다(Nuxt 앱 컨텍스트가
  // await 경계를 넘으면서 유실됨). fetch()가 이미 await 이전에 잡아둔 client를 그대로 넘겨써야 한다.
  const fetchManagedDepartments = async (supabase: ReturnType<typeof useSupabaseClient<Database>>) => {
    if (!account.value) {
      managedDepartmentIds.value = []
      return
    }
    const { data } = await supabase
      .schema('admin')
      .from('departments')
      .select('id')
      .eq('manager_admin_account_id', account.value.id)
      .eq('deleted', false)
    managedDepartmentIds.value = (data ?? []).map(d => d.id)
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
    managedDepartmentIds.value = []
  }

  return { account, loading, loaded, managedDepartmentIds, roles, isSuperAdmin, isActive, isDepartmentHead, fetch, ensureAccount, reset }
})
