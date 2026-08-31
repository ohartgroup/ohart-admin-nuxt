<script setup lang="ts">
// artboda-web-nuxt app/components/legal/LegalTable.vue 포팅.
defineProps<{
  title: string
  rows: { label: string, value: string }[]
}>()
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-accented">
    <div class="bg-muted px-4 py-3">
      <p class="text-base font-bold text-highlighted">
        {{ title }}
      </p>
    </div>
    <div
      v-for="(row, index) in rows"
      :key="index"
      class="flex gap-3 border-t border-accented px-4 py-3"
    >
      <p class="w-[160px] shrink-0 text-sm font-bold text-highlighted sm:w-[200px]">
        {{ row.label }}
      </p>
      <p class="flex-1 text-sm text-toned">
        {{ row.value }}
      </p>
    </div>
  </div>
</template>
