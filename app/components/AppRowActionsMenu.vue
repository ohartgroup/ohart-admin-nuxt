<script setup lang="ts">
// 목록 행마다 "활성화/비활성화 + 삭제" 또는 "복구" 버튼이 나란히 붙어있던 걸 케밥(⋮) 메뉴
// 하나로 통합 — catalog-taxonomies.vue/departments.vue/permissions.vue(서비스 목록)가 공유한다.
// 삭제된 행이면 복구만, 아니면 활성화토글+삭제를 보여준다(둘 다 동시에 있을 일은 없음).
const props = defineProps<{
  activated: boolean
  deleted: boolean
}>()

const emit = defineEmits<{
  toggle: []
  delete: []
  restore: []
}>()

const items = computed(() => {
  if (props.deleted) {
    return [{ label: '복구', icon: 'i-lucide-rotate-ccw', onSelect: () => emit('restore') }]
  }
  return [
    {
      label: props.activated ? '비활성화' : '활성화',
      icon: props.activated ? 'i-lucide-eye-off' : 'i-lucide-eye',
      onSelect: () => emit('toggle'),
    },
    { label: '삭제', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => emit('delete') },
  ]
})
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      icon="i-lucide-more-vertical"
      variant="ghost"
      color="neutral"
      size="xs"
      aria-label="작업 메뉴"
    />
  </UDropdownMenu>
</template>
