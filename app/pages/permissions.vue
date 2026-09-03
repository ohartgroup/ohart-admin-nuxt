<script setup lang="ts">
definePageMeta({ layout: 'default', title: '서비스 권한 관리' })

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
const { log } = useAuditLog()
const toast = useToast()
const supabase = useSupabaseClient()

const accounts = ref<ActiveAccount[]>([])
const services = ref<{ label: string, value: string }[]>([])
const loading = ref(false)
const grantForm = ref<Record<string, { roleType: string, serviceId?: string }>>({})
const newServiceName = ref('')
const newServiceSlug = ref('')
const creatingService = ref(false)

const roleOptions = [
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Service Admin', value: 'service_admin' },
  { label: 'Settlement Viewer', value: 'settlement_viewer' },
]

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
    grantForm.value[account.id] ??= { roleType: 'service_admin' }
  }
  loading.value = false
}

const loadServices = async () => {
  const { data } = await supabase.from('services').select('id, name').eq('deleted', false).order('name')
  services.value = (data ?? []).map(s => ({ label: s.name, value: s.id }))
}

onMounted(async () => {
  await Promise.all([loadAccounts(), loadServices()])
})

// public.services는 RLS(admin_write)로 super_admin에게 이미 직접 insert가 열려있어서
// 서버 API 없이 클라이언트에서 바로 등록한다.
const createService = async () => {
  if (!newServiceName.value.trim() || !newServiceSlug.value.trim()) {
    return
  }
  creatingService.value = true
  const { error } = await supabase
    .from('services')
    .insert({ name: newServiceName.value.trim(), slug: newServiceSlug.value.trim() })
  creatingService.value = false

  if (error) {
    toast.add({ title: '서비스 등록에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  await log('service_created', { targetResource: { name: newServiceName.value.trim(), slug: newServiceSlug.value.trim() } })
  newServiceName.value = ''
  newServiceSlug.value = ''
  toast.add({ title: '서비스가 등록되었습니다.', color: 'success' })
  await loadServices()
}

const grant = async (account: ActiveAccount) => {
  const form = grantForm.value[account.id] ?? { roleType: 'service_admin' }
  await $fetch('/api/admin/grant-role', {
    method: 'POST',
    body: { adminAccountId: account.id, roleType: form.roleType, serviceId: form.serviceId },
  })
  await log('role_granted', { targetResource: { adminAccountId: account.id, roleType: form.roleType, serviceId: form.serviceId } })
  toast.add({ title: '권한이 부여되었습니다.', color: 'success' })
  await loadAccounts()
}

const revoke = async (account: ActiveAccount, role: RoleAssignment) => {
  await $fetch('/api/admin/revoke-role', { method: 'POST', body: { roleAssignmentId: role.id } })
  await log('role_revoked', { targetResource: { adminAccountId: account.id, roleAssignmentId: role.id } })
  toast.add({ title: '권한이 회수되었습니다.', color: 'neutral' })
  await loadAccounts()
}
</script>

<template>
  <div class="p-6 max-w-4xl flex flex-col gap-4">
    <UPageCard
      v-if="loaded && !isSuperAdmin"
      title="접근 권한이 없습니다"
      description="서비스 권한 관리는 Super Admin만 사용할 수 있습니다."
      icon="i-lucide-lock"
    />

    <template v-else>
      <UPageCard title="서비스 추가">
        <div class="flex gap-2">
          <UInput
            v-model="newServiceName"
            aria-label="서비스명"
            placeholder="서비스명(예: 아트스쿨)"
            class="flex-1"
          />
          <UInput
            v-model="newServiceSlug"
            aria-label="slug"
            placeholder="slug(예: artschool)"
            class="w-48"
          />
          <UButton
            label="추가"
            icon="i-lucide-plus"
            :loading="creatingService"
            @click="createService"
          />
        </div>
      </UPageCard>

      <p
        v-if="!loading && accounts.length === 0"
        class="text-sm text-muted"
      >
        활성화된 관리자 계정이 없습니다.
      </p>

      <UPageCard
        v-for="account in accounts"
        :key="account.id"
      >
        <div class="flex items-center justify-between mb-3">
          <div>
            <p class="font-medium">
              {{ account.user?.email }}
            </p>
            <p class="text-xs text-muted">
              {{ account.user?.display_name }} · {{ account.department?.name ?? '부서 미설정' }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mb-3">
          <UBadge
            v-for="role in account.roleAssignments"
            :key="role.id"
            variant="subtle"
          >
            {{ roleLabels[role.roleType] ?? role.roleType }}<span v-if="role.serviceName"> · {{ role.serviceName }}</span>
            <UButton
              icon="i-lucide-x"
              size="xs"
              variant="link"
              color="neutral"
              class="ml-1 p-0"
              @click="revoke(account, role)"
            />
          </UBadge>
          <span
            v-if="account.roleAssignments.length === 0"
            class="text-sm text-muted"
          >권한 없음</span>
        </div>

        <div class="flex gap-2">
          <USelect
            v-model="grantForm[account.id]!.roleType"
            :items="roleOptions"
            value-key="value"
            aria-label="권한"
            class="w-44"
          />
          <USelect
            v-model="grantForm[account.id]!.serviceId"
            :items="services"
            value-key="value"
            aria-label="서비스"
            placeholder="서비스(super_admin은 전체)"
            :disabled="grantForm[account.id]?.roleType === 'super_admin'"
            class="w-56"
          />
          <UButton
            label="권한 부여"
            size="sm"
            @click="grant(account)"
          />
        </div>
      </UPageCard>
    </template>
  </div>
</template>
