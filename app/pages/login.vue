<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const toast = useToast()
const route = useRoute()

const email = ref('')
const sending = ref(false)
const sent = ref(false)

onMounted(() => {
  const rejected = route.query.rejected
  if (typeof rejected === 'string') {
    toast.add({ title: '로그인이 거부되었습니다.', description: rejected, color: 'error' })
  }
})

const isAllowedDomain = computed(() => email.value.trim().toLowerCase().endsWith('@kama.ne.kr'))

const sendMagicLink = async () => {
  if (!isAllowedDomain.value) {
    toast.add({ title: '@kama.ne.kr 이메일만 로그인할 수 있습니다.', color: 'error' })
    return
  }

  sending.value = true
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value.trim(),
    options: { emailRedirectTo: `${window.location.origin}/confirm` },
  })
  sending.value = false

  if (error) {
    toast.add({ title: '메일 발송에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  sent.value = true
}
</script>

<template>
  <UCard>
    <template #header>
      <h1 class="text-lg font-semibold">
        ohart-admin 로그인
      </h1>
      <p class="text-sm text-muted mt-1">
        @kama.ne.kr 이메일로 매직링크를 받아 로그인합니다.
      </p>
    </template>

    <div
      v-if="sent"
      class="flex flex-col items-center gap-2 py-6 text-center"
    >
      <UIcon
        name="i-lucide-mail-check"
        class="size-8 text-primary"
      />
      <p class="text-sm">
        <span class="font-medium">{{ email }}</span> 로 로그인 링크를 보냈습니다.
      </p>
      <p class="text-xs text-muted">
        메일함(스팸함 포함)을 확인해주세요.
      </p>
    </div>

    <UForm
      v-else
      :state="{ email }"
      class="flex flex-col gap-4"
      @submit="sendMagicLink"
    >
      <UFormField
        label="이메일"
        name="email"
      >
        <UInput
          v-model="email"
          type="email"
          placeholder="name@kama.ne.kr"
          class="w-full"
          autofocus
        />
      </UFormField>

      <UButton
        type="submit"
        label="매직링크 받기"
        block
        :loading="sending"
      />
    </UForm>
  </UCard>
</template>
