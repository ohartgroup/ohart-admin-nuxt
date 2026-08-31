<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const toast = useToast()

const code = ref('')
const verifying = ref(false)
const factorId = ref('')
const loadError = ref('')

onMounted(async () => {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) {
    loadError.value = error.message
    return
  }
  const totp = data.totp[0]
  if (!totp) {
    loadError.value = '등록된 인증 수단이 없습니다. 관리자에게 문의해주세요.'
    return
  }
  factorId.value = totp.id
})

const verify = async () => {
  if (code.value.trim().length !== 6) {
    return
  }
  verifying.value = true
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factorId.value, code: code.value.trim() })
  verifying.value = false

  if (error) {
    toast.add({ title: '인증에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  navigateTo('/', { replace: true })
}

const signOut = async () => {
  await supabase.auth.signOut()
  navigateTo('/login', { replace: true })
}
</script>

<template>
  <UCard>
    <template #header>
      <h1 class="text-lg font-semibold">
        2단계 인증
      </h1>
      <p class="text-sm text-muted mt-1">
        인증 앱에 뜨는 6자리 코드를 입력해주세요.
      </p>
    </template>

    <div
      v-if="loadError"
      class="text-sm text-error py-4 text-center"
    >
      {{ loadError }}
    </div>

    <div
      v-else
      class="flex flex-col gap-4"
    >
      <UInput
        v-model="code"
        maxlength="6"
        placeholder="000000"
        aria-label="인증 코드"
        class="w-full"
        autofocus
        @keyup.enter="verify"
      />
      <UButton
        label="확인"
        block
        :loading="verifying"
        :disabled="!factorId"
        @click="verify"
      />
    </div>

    <template #footer>
      <UButton
        label="로그아웃"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="signOut"
      />
    </template>
  </UCard>
</template>
