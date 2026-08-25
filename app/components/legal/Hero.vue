<script setup lang="ts">
// artboda-web-nuxt app/components/legal/LegalHero.vue 포팅 — 실사용 화면과 동일한 스타일로 미리보기하기 위함.
defineProps<{
  eyebrow: string
  title: string
  meta: string
}>()
</script>

<template>
  <div>
    <p class="text-xs font-bold tracking-wide text-muted">
      {{ eyebrow }}
    </p>
    <h1 class="mt-2 text-2xl leading-tight font-black text-highlighted lg:text-[34px]">
      {{ title }}
    </h1>
    <p class="mt-2 text-sm text-toned">
      {{ meta }}
    </p>
  </div>
</template>
