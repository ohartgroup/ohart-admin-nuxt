<script setup lang="ts">
// artboda-web-nuxt app/components/legal/LegalArticle.vue 포팅.
// 단, admin 쪽 body는 tiptap(UEditor)이 생성한 HTML 문자열이라 원본처럼 줄바열 배열로 쪼개
// <p>를 반복하는 대신, v-html로 그대로 렌더링해서 굵게/목록 등 서식이 미리보기에도 보이게 한다.
defineProps<{
  id: string
  heading: string
  body: string
}>()
</script>

<template>
  <div
    :id="id"
    class="scroll-mt-4 space-y-1.5 border-b border-accented pb-3"
  >
    <p class="text-lg font-bold text-highlighted">
      {{ heading }}
    </p>
    <!-- eslint-disable vue/no-v-html -->
    <div
      class="space-y-1.5 text-base leading-relaxed text-toned [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
      v-html="body"
    />
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>
