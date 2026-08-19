<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const { account, refresh } = useAdminAuth()

const signOut = async () => {
  await supabase.auth.signOut()
  navigateTo('/login', { replace: true })
}
</script>

<template>
  <UCard>
    <template #header>
      <h1 class="text-lg font-semibold">
        승인 대기 중
      </h1>
    </template>

    <div class="flex flex-col items-center gap-3 py-4 text-center">
      <UIcon
        name="i-lucide-clock"
        class="size-8 text-warning"
      />
      <p
        v-if="account?.status === 'suspended'"
        class="text-sm"
      >
        계정이 정지되었습니다. 관리자에게 문의해주세요.
      </p>
      <p
        v-else
        class="text-sm"
      >
        가입 요청이 접수되었습니다. Super Admin의 권한 부여를 기다려주세요.
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="새로고침"
          variant="soft"
          icon="i-lucide-refresh-cw"
          @click="refresh"
        />
        <UButton
          label="로그아웃"
          variant="ghost"
          color="neutral"
          @click="signOut"
        />
      </div>
    </template>
  </UCard>
</template>
