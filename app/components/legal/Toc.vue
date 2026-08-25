<script setup lang="ts">
// artboda-web-nuxt app/components/legal/LegalToc.vue 포팅.
defineProps<{
  items: { id: string, label: string }[]
}>()
</script>

<template>
  <nav
    aria-label="목차"
    class="rounded-xl border border-accented bg-muted p-4 lg:sticky lg:top-24"
  >
    <p class="text-base font-bold text-highlighted">
      목차
    </p>
    <ul class="mt-2 space-y-2">
      <li
        v-for="item in items"
        :key="item.id"
      >
        <a
          :href="`#${item.id}`"
          class="text-xs font-medium text-toned hover:text-highlighted"
        >
          {{ item.label }}
        </a>
      </li>
    </ul>
  </nav>
</template>
