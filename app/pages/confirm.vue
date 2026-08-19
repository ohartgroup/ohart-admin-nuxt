<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const user = useSupabaseUser()

watch(user, (value) => {
  if (value) {
    navigateTo('/', { replace: true })
  }
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-10 text-center">
    <UIcon
      name="i-lucide-loader-circle"
      class="size-6 animate-spin text-primary"
    />
    <p class="text-sm text-muted">
      로그인 처리 중입니다...
    </p>
  </div>
</template>
