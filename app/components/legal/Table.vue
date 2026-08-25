<script setup lang="ts">
// artboda-web-nuxt app/components/legal/LegalTable.vue 포팅.
defineProps<{
  title: string
  rows: { label: string, value: string }[]
}>()
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-accented">
    <div class="bg-muted px-3.5 py-2.5">
      <p class="text-xs font-bold text-highlighted">
        {{ title }}
      </p>
    </div>
    <div
      v-for="(row, index) in rows"
      :key="index"
      class="flex gap-2.5 border-t border-accented px-3.5 py-2.5"
    >
      <p class="w-[140px] shrink-0 text-[11px] font-bold text-highlighted sm:w-[180px]">
        {{ row.label }}
      </p>
      <p class="flex-1 text-[11px] text-toned">
        {{ row.value }}
      </p>
    </div>
  </div>
</template>
