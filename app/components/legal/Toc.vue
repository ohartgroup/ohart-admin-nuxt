<script setup lang="ts">
// artboda-web-nuxt app/components/legal/LegalToc.vue 포팅.
// 실사용 화면은 페이지 전체가 스크롤되지만, 여기선 USlideover 내부의 별도 스크롤
// 컨테이너 안이라 <a href="#id">의 브라우저 기본 해시 점프가 먹지 않는다.
// 그래서 클릭 시 직접 scrollIntoView로 스크롤시킨다.
defineProps<{
  items: { id: string, label: string }[]
}>()

const scrollToItem = (id: string, event: MouseEvent) => {
  event.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <nav
    aria-label="목차"
    class="rounded-xl border border-accented bg-muted p-4 lg:sticky lg:top-24"
  >
    <p class="text-lg font-bold text-highlighted">
      목차
    </p>
    <ul class="mt-2 space-y-2">
      <li
        v-for="item in items"
        :key="item.id"
      >
        <a
          :href="`#${item.id}`"
          class="text-sm font-medium text-toned hover:text-highlighted"
          @click="scrollToItem(item.id, $event)"
        >
          {{ item.label }}
        </a>
      </li>
    </ul>
  </nav>
</template>
