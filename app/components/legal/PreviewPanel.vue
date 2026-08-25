<script setup lang="ts">
import type { LegalBlock } from '~/types/legal'

defineProps<{
  eyebrow: string
  title: string
  meta: string
  toc: { id: string, label: string }[]
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

    <div class="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
      <div
        v-if="toc.length > 0"
        class="w-full shrink-0 lg:w-[250px]"
      >
        <LegalToc :items="toc" />
      </div>

      <div class="flex min-w-0 flex-1 flex-col gap-4">
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
  </div>
</template>
