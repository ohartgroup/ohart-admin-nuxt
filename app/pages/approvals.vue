<script setup lang="ts">
definePageMeta({ layout: 'default', title: '가입 승인' })

interface PendingAccount {
  id: string
  status: 'pending' | 'active' | 'suspended'
  created_at: string
  user: { email: string | null, display_name: string | null } | null
}

const { isSuperAdmin, loaded } = useAdminAuth()
const { log } = useAuditLog()
const toast = useToast()

const accounts = ref<PendingAccount[]>([])
const { options: departments, load: loadDepartments } = useDepartmentOptions()
const loading = ref(false)
const selections = ref<Record<string, { roleType: string, departmentId?: string }>>({})

const roleOptions = [
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Service Admin', value: 'service_admin' },
  { label: 'Settlement Viewer', value: 'settlement_viewer' },
]

const loadAccounts = async () => {
  loading.value = true
  const data = await $fetch<PendingAccount[]>('/api/admin/pending-accounts')
  accounts.value = data
  for (const account of data) {
    selections.value[account.id] ??= { roleType: 'service_admin' }
  }
  loading.value = false
}

onMounted(async () => {
  await Promise.all([loadAccounts(), loadDepartments()])
})

const approve = async (account: PendingAccount) => {
  const selection = selections.value[account.id] ?? { roleType: 'service_admin' }
  await $fetch('/api/admin/approve', {
    method: 'POST',
    body: { adminAccountId: account.id, roleType: selection.roleType, departmentId: selection.departmentId },
  })
  await log('admin_account_approved', { targetResource: { adminAccountId: account.id, roleType: selection.roleType } })
  toast.add({ title: `${account.user?.email ?? account.id} 승인 완료`, color: 'success' })
  await loadAccounts()
}

const reject = async (account: PendingAccount) => {
  await $fetch('/api/admin/reject', { method: 'POST', body: { adminAccountId: account.id } })
  await log('admin_account_rejected', { targetResource: { adminAccountId: account.id } })
  toast.add({ title: `${account.user?.email ?? account.id} 거부 처리됨`, color: 'neutral' })
  await loadAccounts()
}

const columns = [
  { accessorKey: 'email', header: '이메일' },
  { accessorKey: 'status', header: '상태' },
  { accessorKey: 'role', header: '권한' },
  { accessorKey: 'department', header: '부서' },
  { accessorKey: 'actions', header: '' },
]
</script>

<template>
  <div class="p-6 max-w-4xl">
    <UPageCard
      v-if="loaded && !isSuperAdmin"
      title="접근 권한이 없습니다"
      description="가입 승인은 Super Admin만 사용할 수 있습니다."
      icon="i-lucide-lock"
    />

    <UTable
      v-else
      :data="accounts"
      :columns="columns"
      :loading="loading"
    >
      <template #email-cell="{ row }">
        <div class="flex flex-col">
          <span class="font-medium">{{ row.original.user?.email }}</span>
          <span class="text-xs text-muted">{{ row.original.user?.display_name }}</span>
        </div>
      </template>

      <template #status-cell="{ row }">
        <UBadge
          :label="row.original.status === 'pending' ? '대기' : '거부됨'"
          :color="row.original.status === 'pending' ? 'warning' : 'neutral'"
          variant="subtle"
        />
      </template>

      <template #role-cell="{ row }">
        <USelect
          v-model="selections[row.original.id]!.roleType"
          :items="roleOptions"
          value-key="value"
          class="w-44"
        />
      </template>

      <template #department-cell="{ row }">
        <USelect
          v-model="selections[row.original.id]!.departmentId"
          :items="departments"
          value-key="value"
          placeholder="부서 선택"
          class="w-40"
        />
      </template>

      <template #actions-cell="{ row }">
        <div class="flex gap-2">
          <UButton
            label="승인"
            size="sm"
            color="primary"
            @click="approve(row.original)"
          />
          <UButton
            label="거부"
            size="sm"
            variant="soft"
            color="error"
            @click="reject(row.original)"
          />
        </div>
      </template>
    </UTable>
  </div>
</template>
