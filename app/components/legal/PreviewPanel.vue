<script setup lang="ts">
import type { LegalBlock } from '~/types/legal'

defineProps<{
  eyebrow: string
  title: string
  meta: string
  blocks: LegalBlock[]
}>()
</script>

<template>
  <div class="px-5 py-8">
    <LegalHero
      :eyebrow="eyebrow"
      :title="title"
      :meta="meta"
    />

    <div class="mt-6 flex flex-col gap-4">
      <template
        v-for="block in blocks"
        :key="block.id"
      >
        <LegalArticle
          v-if="block.type === 'article'"
          :id="block.id"
          :heading="block.heading"
          :body="block.body"
        />
        <div
          v-else
          :id="block.id"
          class="scroll-mt-4"
        >
          <LegalTable
            :title="block.title"
            :rows="block.rows"
          />
        </div>
      </template>
    </div>
  </div>
</template>
