<script setup lang="ts">
definePageMeta({ layout: 'default', title: '관리자 관리' })

interface RoleAssignment {
  id: string
  roleType: 'super_admin' | 'service_admin' | 'settlement_viewer'
  serviceId: string | null
  serviceName: string | null
}

interface ActiveAccount {
  id: string
  user: { email: string | null, display_name: string | null } | null
  department: { id: string, name: string } | null
  roleAssignments: RoleAssignment[]
}

const { isSuperAdmin, loaded } = useAdminAuth()
const supabase = useSupabaseClient()
const { log } = useAuditLog()
const toast = useToast()

const accounts = ref<ActiveAccount[]>([])
const { options: departmentOptions, load: loadDepartments } = useDepartmentOptions()
const loading = ref(false)
const draftDepartment = ref<Record<string, string | undefined>>({})
const saving = ref<Record<string, boolean>>({})

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  service_admin: 'Service Admin',
  settlement_viewer: 'Settlement Viewer',
}

const loadAccounts = async () => {
  loading.value = true
  const data = await $fetch<ActiveAccount[]>('/api/admin/active-accounts')
  accounts.value = data
  for (const account of data) {
    draftDepartment.value[account.id] = account.department?.id
  }
  loading.value = false
}

onMounted(async () => {
  await Promise.all([loadAccounts(), loadDepartments()])
})

const searchAdmin = (row: Record<string, unknown>, query: string) => {
  const account = row as unknown as ActiveAccount
  return (account.user?.email?.toLowerCase().includes(query) ?? false)
    || (account.user?.display_name?.toLowerCase().includes(query) ?? false)
}

// admin.set_admin_department는 함수 내부에서 super_admin인지 직접 확인하므로
// 클라이언트에서 바로 호출해도 안전하다(다른 관리자가 몰래 호출해도 예외로 거부됨).
const saveDepartment = async (account: ActiveAccount) => {
  saving.value[account.id] = true
  const { error } = await supabase
    .schema('admin')
    .rpc('set_admin_department', { p_admin_account_id: account.id, p_department_id: draftDepartment.value[account.id] })
  saving.value[account.id] = false

  if (error) {
    toast.add({ title: '부서 지정에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  await log('admin_department_changed', { targetResource: { adminAccountId: account.id, departmentId: draftDepartment.value[account.id] } })
  toast.add({ title: '부서가 지정되었습니다.', color: 'success' })
  await loadAccounts()
}

const columns = [
  { accessorKey: 'email', header: '이메일' },
  { accessorKey: 'department', header: '부서' },
  { accessorKey: 'roles', header: '권한' },
]
</script>

<template>
  <div class="p-6">
    <UPageCard
      v-if="loaded && !isSuperAdmin"
      title="접근 권한이 없습니다"
      description="관리자 관리는 Super Admin만 사용할 수 있습니다."
      icon="i-lucide-lock"
    />

    <AppDataTable
      v-else
      :data="accounts"
      :columns="columns"
      :loading="loading"
      :search-fn="searchAdmin"
      search-placeholder="이메일/이름 검색"
    >
      <template #email-cell="{ row }">
        <div class="flex flex-col">
          <span class="font-medium">{{ row.original.user?.email }}</span>
          <span class="text-xs text-muted">{{ row.original.user?.display_name }}</span>
        </div>
      </template>

      <template #department-cell="{ row }">
        <div class="flex gap-2">
          <USelect
            v-model="draftDepartment[row.original.id]"
            :items="departmentOptions"
            value-key="value"
            aria-label="부서"
            placeholder="부서 선택"
            class="w-48"
          />
          <UButton
            label="저장"
            size="sm"
            :loading="saving[row.original.id]"
            :disabled="draftDepartment[row.original.id] === row.original.department?.id"
            @click="saveDepartment(row.original)"
          />
        </div>
      </template>

      <template #roles-cell="{ row }">
        <div class="flex flex-wrap gap-1">
          <UBadge
            v-for="role in row.original.roleAssignments"
            :key="role.id"
            :label="role.serviceName ? `${roleLabels[role.roleType] ?? role.roleType} · ${role.serviceName}` : (roleLabels[role.roleType] ?? role.roleType)"
            variant="subtle"
          />
          <span
            v-if="row.original.roleAssignments.length === 0"
            class="text-xs text-muted"
          >권한 없음</span>
        </div>
      </template>
    </AppDataTable>
  </div>
</template>
