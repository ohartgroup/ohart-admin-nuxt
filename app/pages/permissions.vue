<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'default', title: '서비스 권한 관리' })

type Service = Database['public']['Tables']['services']['Row']

interface RoleAssignment {
  id: string
  roleType: 'super_admin' | 'service_admin' | 'settlement_viewer'
  serviceId: string | null
  serviceName: string | null
  deleted: boolean
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
const serviceList = ref<Service[]>([])
const loading = ref(false)
const grantForm = ref<Record<string, { roleType: string, serviceId?: string }>>({})
const newServiceName = ref('')
const newServiceSlug = ref('')
const creatingService = ref(false)
// 회수된(deleted=true) 권한도 같이 불러와서 보고 되돌릴 수 있게 하는 토글.
const showRevokedRoles = ref(false)
// 오작동 삭제 대비 — 켜면 deleted=true인 서비스도 같이 불러와서 복구할 수 있게 한다.
const showDeletedServices = ref(false)

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
  const data = await $fetch<ActiveAccount[]>('/api/admin/active-accounts', {
    query: { includeRevokedRoles: showRevokedRoles.value ? 'true' : undefined },
  })
  accounts.value = data
  for (const account of data) {
    grantForm.value[account.id] ??= { roleType: 'service_admin' }
  }
  loading.value = false
}

watch(showRevokedRoles, loadAccounts)

// 권한 부여 드롭다운용 — 토글 상태와 무관하게 항상 활성/비삭제 서비스만.
const loadServices = async () => {
  const { data } = await supabase.from('services').select('id, name').eq('deleted', false).order('name')
  services.value = (data ?? []).map(s => ({ label: s.name, value: s.id }))
}

// 서비스 목록 표시용 — showDeletedServices 토글에 따라 삭제된 서비스도 같이 불러온다.
const loadServiceList = async () => {
  let query = supabase.from('services').select('*').order('name')
  if (!showDeletedServices.value) {
    query = query.eq('deleted', false)
  }
  const { data } = await query
  serviceList.value = data ?? []
}

watch(showDeletedServices, loadServiceList)

onMounted(async () => {
  await Promise.all([loadAccounts(), loadServices(), loadServiceList()])
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
  await Promise.all([loadServices(), loadServiceList()])
}

const toggleServiceActive = async (service: Service) => {
  const { error } = await supabase
    .from('services')
    .update({ activated: !service.activated })
    .eq('id', service.id)

  if (error) {
    toast.add({ title: '변경에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  await Promise.all([loadServices(), loadServiceList()])
}

// 관리자 화면 삭제는 실제 row를 지우지 않고 deleted=true로만 처리한다(soft delete) —
// 이미 이 서비스로 배정된 role_assignments/products 등이 참조 중일 수 있어서
// 실제로 지우면 참조 무결성이 깨진다.
const deleteService = async (service: Service) => {
  if (!confirm(`'${service.name}'을(를) 삭제할까요? 이 서비스로 배정된 권한/데이터가 있다면 그대로 남아있을 수 있습니다.`)) {
    return
  }
  const { error } = await supabase
    .from('services')
    .update({ deleted: true })
    .eq('id', service.id)

  if (error) {
    toast.add({ title: '삭제에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  await Promise.all([loadServices(), loadServiceList()])
}

const restoreService = async (service: Service) => {
  const { error } = await supabase
    .from('services')
    .update({ deleted: false })
    .eq('id', service.id)

  if (error) {
    toast.add({ title: '복구에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  toast.add({ title: '복구되었습니다.', color: 'success' })
  await Promise.all([loadServices(), loadServiceList()])
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

const restore = async (account: ActiveAccount, role: RoleAssignment) => {
  await $fetch('/api/admin/restore-role', { method: 'POST', body: { roleAssignmentId: role.id } })
  await log('role_restored', { targetResource: { adminAccountId: account.id, roleAssignmentId: role.id } })
  toast.add({ title: '권한이 복구되었습니다.', color: 'success' })
  await loadAccounts()
}

const serviceColumns = [
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'slug', header: 'slug' },
  { accessorKey: 'status', header: '상태' },
  { accessorKey: 'actions', header: '작업' },
]

// AppDataTable의 search-keys는 row의 평평한(flat) 속성만 읽을 수 있어서
// account.user?.email 같은 중첩 값을 검색 가능한 필드로 미리 펼쳐둔다.
const accountRows = computed(() =>
  accounts.value.map(account => ({
    ...account,
    email: account.user?.email ?? '',
    displayName: account.user?.display_name ?? '',
    departmentName: account.department?.name ?? '부서 미설정',
  })),
)

const accountColumns = [
  { accessorKey: 'email', header: '이메일' },
  { accessorKey: 'departmentName', header: '부서' },
  { accessorKey: 'roles', header: '권한' },
  { accessorKey: 'grant', header: '작업' },
]

const tabItems = [
  { label: '서비스', icon: 'i-lucide-layers', slot: 'services' as const },
  { label: '관리자별 권한', icon: 'i-lucide-user-cog', slot: 'roles' as const },
]
</script>

<template>
  <div class="p-6 flex flex-col gap-4">
    <UPageCard
      v-if="loaded && !isSuperAdmin"
      title="접근 권한이 없습니다"
      description="서비스 권한 관리는 Super Admin만 사용할 수 있습니다."
      icon="i-lucide-lock"
    />

    <template v-else>
      <UTabs
        :items="tabItems"
        class="w-full"
      >
        <template #services>
          <div class="flex flex-col gap-4 pt-4">
            <p class="text-sm text-muted">
              artboda·stub 같은 서비스 자체를 추가/삭제합니다. 삭제해도 이 서비스로 배정된 권한/데이터는 그대로 남아있을 수 있습니다.
            </p>

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

            <AppDataTable
              :data="serviceList"
              :columns="serviceColumns"
              :search-keys="['name', 'slug']"
              search-placeholder="서비스명/slug 검색"
            >
              <template #filters>
                <UCheckbox
                  v-model="showDeletedServices"
                  label="삭제된 서비스 보기"
                />
              </template>

              <template #status-cell="{ row }">
                <UBadge
                  v-if="row.original.deleted"
                  label="삭제됨"
                  color="error"
                  variant="subtle"
                />
                <UBadge
                  v-else
                  :label="row.original.activated ? '사용' : '미사용'"
                  :color="row.original.activated ? 'success' : 'neutral'"
                  variant="subtle"
                />
              </template>

              <template #actions-cell="{ row }">
                <AppRowActionsMenu
                  :activated="row.original.activated"
                  :deleted="row.original.deleted"
                  @toggle="toggleServiceActive(row.original)"
                  @delete="deleteService(row.original)"
                  @restore="restoreService(row.original)"
                />
              </template>
            </AppDataTable>
          </div>
        </template>

        <template #roles>
          <div class="flex flex-col gap-4 pt-4">
            <div class="flex items-center justify-between">
              <p class="text-sm text-muted">
                관리자 계정별로 어떤 서비스에 어떤 권한(super_admin/service_admin/settlement_viewer)이 있는지 부여/회수합니다.
              </p>
              <UCheckbox
                v-model="showRevokedRoles"
                label="회수된 권한 보기"
              />
            </div>

            <p
              v-if="!loading && accounts.length === 0"
              class="text-sm text-muted"
            >
              활성화된 관리자 계정이 없습니다.
            </p>

            <AppDataTable
              v-else
              :data="accountRows"
              :columns="accountColumns"
              :search-keys="['email', 'displayName', 'departmentName']"
              search-placeholder="이메일/이름/부서 검색"
            >
              <template #email-cell="{ row }">
                <div>
                  <p class="font-medium">
                    {{ row.original.email }}
                  </p>
                  <p class="text-xs text-muted">
                    {{ row.original.displayName }}
                  </p>
                </div>
              </template>

              <template #departmentName-cell="{ row }">
                <span class="text-sm text-muted">{{ row.original.departmentName }}</span>
              </template>

              <template #roles-cell="{ row }">
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="role in row.original.roleAssignments"
                    :key="role.id"
                    variant="subtle"
                    :color="role.deleted ? 'neutral' : 'primary'"
                    :class="role.deleted && 'opacity-60'"
                  >
                    {{ roleLabels[role.roleType] ?? role.roleType }}<span v-if="role.serviceName"> · {{ role.serviceName }}</span><span v-if="role.deleted"> · 회수됨</span>
                    <UButton
                      v-if="role.deleted"
                      icon="i-lucide-rotate-ccw"
                      size="xs"
                      variant="link"
                      color="neutral"
                      class="ml-1 p-0"
                      :aria-label="`${roleLabels[role.roleType] ?? role.roleType} 권한 복구`"
                      @click="restore(row.original, role)"
                    />
                    <UButton
                      v-else
                      icon="i-lucide-x"
                      size="xs"
                      variant="link"
                      color="neutral"
                      class="ml-1 p-0"
                      :aria-label="`${roleLabels[role.roleType] ?? role.roleType} 권한 회수`"
                      @click="revoke(row.original, role)"
                    />
                  </UBadge>
                  <span
                    v-if="row.original.roleAssignments.length === 0"
                    class="text-sm text-muted"
                  >권한 없음</span>
                </div>
              </template>

              <template #grant-cell="{ row }">
                <UPopover>
                  <UButton
                    label="권한 부여"
                    icon="i-lucide-plus"
                    size="xs"
                    variant="soft"
                  />
                  <template #content>
                    <div class="flex flex-col gap-2 p-3 w-64">
                      <USelect
                        v-model="grantForm[row.original.id]!.roleType"
                        :items="roleOptions"
                        value-key="value"
                        aria-label="권한"
                      />
                      <USelect
                        v-model="grantForm[row.original.id]!.serviceId"
                        :items="services"
                        value-key="value"
                        aria-label="서비스"
                        placeholder="서비스(super_admin은 전체)"
                        :disabled="grantForm[row.original.id]?.roleType === 'super_admin'"
                      />
                      <UButton
                        label="권한 부여"
                        size="sm"
                        block
                        @click="grant(row.original)"
                      />
                    </div>
                  </template>
                </UPopover>
              </template>
            </AppDataTable>
          </div>
        </template>
      </UTabs>
    </template>
  </div>
</template>
