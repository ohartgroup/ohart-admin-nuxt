<script setup lang="ts">
// 등록/수정 폼을 여는 공통 다이얼로그 — legal.vue(신규 버전 등록), performances.vue(신규 등록·수정)가
// 공유한다. USlideover(옆에서 밀려나오는 패널, 미리보기 같은 부가 화면용)와는 달리 중앙에 뜨는
// UModal을 쓴다 — 폼 입력처럼 "지금 이 작업에 집중"해야 하는 흐름에 더 맞는다.
defineProps<{
  title: string
  description?: string
}>()

const open = defineModel<boolean>('open', { required: true })
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <slot />
    </template>
  </UModal>
</template>
