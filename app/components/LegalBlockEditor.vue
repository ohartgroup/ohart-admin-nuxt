<script setup lang="ts">
// 바깥 구조(article/table 순서, table의 rows)는 폼으로 명시적으로 관리해서 항상
// legal_document_versions.content 스키마와 일치하도록 보장한다. tiptap은 article의
// body 안쪽 텍스트에만 씀 — 전체를 자유형식 에디터 하나로 만들면 저장 시 "이 제목이
// 몇 번째 article인지, 이 표가 label/value 2열이 맞는지"를 역파싱해야 해서 쉽게 깨진다.
import type { LegalBlock, LegalTableBlock } from '~/types/legal'

const blocks = defineModel<LegalBlock[]>({ required: true })

const genId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`

const addArticle = () => {
  blocks.value.push({ type: 'article', id: genId('art'), heading: '', body: '' })
}
const addTable = () => {
  blocks.value.push({ type: 'table', id: genId('table'), title: '', rows: [{ label: '', value: '' }] })
}
const removeBlock = (index: number) => {
  blocks.value.splice(index, 1)
}
const moveBlock = (index: number, direction: -1 | 1) => {
  const target = index + direction
  if (target < 0 || target >= blocks.value.length) {
    return
  }
  const [item] = blocks.value.splice(index, 1)
  blocks.value.splice(target, 0, item!)
}

const addRow = (table: LegalTableBlock) => {
  table.rows.push({ label: '', value: '' })
}
const removeRow = (table: LegalTableBlock, index: number) => {
  table.rows.splice(index, 1)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UPageCard
      v-for="(block, index) in blocks"
      :key="block.id"
    >
      <div class="flex items-center justify-between mb-3">
        <UBadge
          :label="block.type === 'article' ? '아티클' : '표'"
          variant="subtle"
          color="neutral"
        />
        <div class="flex gap-1">
          <UButton
            icon="i-lucide-arrow-up"
            size="xs"
            variant="ghost"
            color="neutral"
            :disabled="index === 0"
            @click="moveBlock(index, -1)"
          />
          <UButton
            icon="i-lucide-arrow-down"
            size="xs"
            variant="ghost"
            color="neutral"
            :disabled="index === blocks.length - 1"
            @click="moveBlock(index, 1)"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            variant="ghost"
            color="error"
            @click="removeBlock(index)"
          />
        </div>
      </div>

      <template v-if="block.type === 'article'">
        <UFormField
          label="제목"
          class="mb-3"
        >
          <UInput
            v-model="block.heading"
            aria-label="아티클 제목"
            placeholder="예: 제1조 (목적)"
            class="w-full"
          />
        </UFormField>
        <UFormField label="본문">
          <UEditor
            v-model="block.body"
            class="min-h-32 border border-default rounded-md p-2"
          />
        </UFormField>
      </template>

      <template v-else>
        <UFormField
          label="표 제목"
          class="mb-3"
        >
          <UInput
            v-model="block.title"
            aria-label="표 제목"
            placeholder="예: 개인정보 보유 기간"
            class="w-full"
          />
        </UFormField>
        <div class="flex flex-col gap-2">
          <div
            v-for="(row, rowIndex) in block.rows"
            :key="rowIndex"
            class="flex gap-2"
          >
            <UInput
              v-model="row.label"
              aria-label="항목"
              placeholder="항목"
              class="w-48"
            />
            <UInput
              v-model="row.value"
              aria-label="내용"
              placeholder="내용"
              class="flex-1"
            />
            <UButton
              icon="i-lucide-x"
              size="xs"
              variant="ghost"
              color="error"
              @click="removeRow(block, rowIndex)"
            />
          </div>
          <UButton
            label="행 추가"
            icon="i-lucide-plus"
            size="xs"
            variant="soft"
            class="self-start"
            @click="addRow(block)"
          />
        </div>
      </template>
    </UPageCard>

    <div class="flex gap-2">
      <UButton
        label="아티클 추가"
        icon="i-lucide-plus"
        variant="soft"
        @click="addArticle"
      />
      <UButton
        label="표 추가"
        icon="i-lucide-plus"
        variant="soft"
        @click="addTable"
      />
    </div>
  </div>
</template>
