<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const { refresh } = useAdminAuth()
const toast = useToast()

const qrCode = ref('')
const factorId = ref('')
const code = ref('')
const verifying = ref(false)
const loadError = ref('')

onMounted(async () => {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'OhArt Admin' })
  if (error) {
    loadError.value = error.message
    return
  }
  qrCode.value = data.totp.qr_code
  factorId.value = data.id
})

const verify = async () => {
  if (code.value.trim().length !== 6) {
    return
  }
  verifying.value = true
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factorId.value, code: code.value.trim() })
  if (error) {
    verifying.value = false
    toast.add({ title: '인증에 실패했습니다.', description: error.message, color: 'error' })
    return
  }

  const { error: rpcError } = await supabase.schema('admin').rpc('mark_mfa_enrolled')
  verifying.value = false
  if (rpcError) {
    toast.add({ title: 'MFA 상태 저장에 실패했습니다.', description: rpcError.message, color: 'error' })
    return
  }

  await refresh()
  toast.add({ title: 'MFA 등록이 완료되었습니다.', color: 'success' })
  navigateTo('/', { replace: true })
}
</script>

<template>
  <UCard>
    <template #header>
      <h1 class="text-lg font-semibold">
        2단계 인증(MFA) 등록
      </h1>
      <p class="text-sm text-muted mt-1">
        전 관리자 필수입니다. Google Authenticator, Authy 등 OTP 앱으로 아래 QR코드를 스캔하세요.
      </p>
    </template>

    <div
      v-if="loadError"
      class="text-sm text-error py-6 text-center"
    >
      {{ loadError }}
    </div>

    <div
      v-else
      class="flex flex-col items-center gap-4"
    >
      <img
        v-if="qrCode"
        :src="qrCode"
        alt="MFA QR코드"
        class="p-3 bg-white rounded-lg size-48"
      >
      <UIcon
        v-else
        name="i-lucide-loader-circle"
        class="size-6 animate-spin text-primary my-8"
      />

      <UFormField
        label="인증 앱에 뜨는 6자리 코드"
        class="w-full"
      >
        <UInput
          v-model="code"
          maxlength="6"
          placeholder="000000"
          aria-label="인증 코드"
          class="w-full"
          @keyup.enter="verify"
        />
      </UFormField>

      <UButton
        label="확인"
        block
        :loading="verifying"
        :disabled="!factorId"
        @click="verify"
      />
    </div>
  </UCard>
</template>
