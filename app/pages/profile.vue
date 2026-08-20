<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'default', title: '내 정보' })

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const { account, refresh } = useAdminAuth()
const toast = useToast()

const displayName = ref('')
const departmentId = ref<string | undefined>(undefined)
const { options: departments, load: loadDepartments } = useDepartmentOptions()
const services = ref<{ id: string, name: string }[]>([])
const savingName = ref(false)
const savingDepartment = ref(false)

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  service_admin: 'Service Admin',
  settlement_viewer: 'Settlement Viewer',
}

const syncFromAccount = () => {
  displayName.value = user.value?.user_metadata?.display_name ?? user.value?.email ?? ''
  departmentId.value = account.value?.department_id ?? undefined
}

const loadServices = async () => {
  const { data } = await supabase.from('services').select('id, name')
  services.value = data ?? []
}

const serviceName = (serviceId: string | null) => services.value.find(s => s.id === serviceId)?.name

const loadDisplayName = async () => {
  if (!user.value) {
    return
  }
  const { data } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.value.sub as string)
    .maybeSingle()
  displayName.value = data?.display_name ?? ''
}

onMounted(async () => {
  syncFromAccount()
  await Promise.all([loadDepartments(), loadDisplayName(), loadServices()])
})

const saveDisplayName = async () => {
  if (!user.value) {
    return
  }
  savingName.value = true
  const { error } = await supabase
    .from('users')
    .update({ display_name: displayName.value })
    .eq('id', user.value.sub as string)
  savingName.value = false

  if (error) {
    toast.add({ title: '이름 저장에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  toast.add({ title: '이름이 저장되었습니다.', color: 'success' })
}

const saveDepartment = async () => {
  savingDepartment.value = true
  const { error } = await supabase
    .schema('admin')
    .rpc('update_own_department', { p_department_id: departmentId.value })
  savingDepartment.value = false

  if (error) {
    toast.add({ title: '부서 저장에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  await refresh()
  toast.add({ title: '부서가 저장되었습니다.', color: 'success' })
}
</script>

<template>
  <div class="p-6 max-w-lg flex flex-col gap-6">
    <UPageCard title="기본 정보">
      <UFormField
        label="이름"
        class="mb-4"
      >
        <div class="flex gap-2">
          <UInput
            v-model="displayName"
            class="w-full"
          />
          <UButton
            label="저장"
            :loading="savingName"
            @click="saveDisplayName"
          />
        </div>
      </UFormField>

      <UFormField label="부서">
        <div class="flex gap-2">
          <USelect
            v-model="departmentId"
            :items="departments"
            value-key="value"
            placeholder="부서 선택"
            class="w-full"
          />
          <UButton
            label="저장"
            :loading="savingDepartment"
            @click="saveDepartment"
          />
        </div>
      </UFormField>
    </UPageCard>

    <UPageCard title="권한">
      <p class="text-xs text-muted mb-2">
        권한은 Super Admin만 부여할 수 있습니다.
      </p>
      <div
        v-if="account?.role_assignments.length"
        class="flex flex-wrap gap-2"
      >
        <UBadge
          v-for="role in account.role_assignments"
          :key="role.id"
          :label="serviceName(role.service_id) ? `${roleLabels[role.role_type] ?? role.role_type} · ${serviceName(role.service_id)}` : (roleLabels[role.role_type] ?? role.role_type)"
          variant="subtle"
        />
      </div>
      <p
        v-else
        class="text-sm text-muted"
      >
        부여된 권한이 없습니다.
      </p>
    </UPageCard>
  </div>
</template>
