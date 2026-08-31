<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'default', title: '내 정보' })

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const { account } = useAdminAuth()
const toast = useToast()

const displayName = ref('')
const services = ref<{ id: string, name: string }[]>([])
const savingName = ref(false)
const resettingMfa = ref(false)

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  service_admin: 'Service Admin',
  settlement_viewer: 'Settlement Viewer',
}

const syncFromAccount = () => {
  displayName.value = user.value?.user_metadata?.display_name ?? user.value?.email ?? ''
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
  await Promise.all([loadDisplayName(), loadServices()])
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

// 재설정 = 등록된 인증 수단 해제 + DB 플래그 되돌리기 → /mfa-setup에서 새로 등록.
// unenroll은 세션이 aal2일 때만 허용되는데, 이 페이지 자체가 미들웨어를 통과해야 진입 가능해서
// 이미 aal2인 상태라 별도 재인증 없이 바로 됨.
const resetMfa = async () => {
  resettingMfa.value = true
  const { data } = await supabase.auth.mfa.listFactors()
  const totp = data?.totp[0]
  if (totp) {
    await supabase.auth.mfa.unenroll({ factorId: totp.id })
  }
  await supabase.schema('admin').rpc('mark_mfa_unenrolled')
  resettingMfa.value = false
  navigateTo('/mfa-setup')
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
        <p class="text-sm">
          {{ account?.department?.name ?? '미지정' }}
        </p>
        <p class="text-xs text-muted mt-1">
          부서는 관리자만 변경할 수 있습니다.
        </p>
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

    <UPageCard title="2단계 인증(MFA)">
      <div class="flex items-center justify-between">
        <UBadge
          label="등록됨"
          color="success"
          variant="subtle"
        />
        <UButton
          label="재설정"
          variant="soft"
          color="neutral"
          size="sm"
          :loading="resettingMfa"
          @click="resetMfa"
        />
      </div>
    </UPageCard>
  </div>
</template>
