<script setup lang="ts">
import type { LegalBlock, LegalDocumentVersion } from '~/types/legal'

definePageMeta({ layout: 'default', title: '아트보다 · 약관 관리' })

const toast = useToast()

const docTypeLabels = { terms: '이용약관', privacy: '개인정보처리방침' } as const
const activeDocType = ref<'terms' | 'privacy'>('terms')

const versions = ref<LegalDocumentVersion[]>([])
const loading = ref(false)
const showCreateForm = ref(false)
const creating = ref(false)

const loadVersions = async () => {
  loading.value = true
  versions.value = await $fetch<LegalDocumentVersion[]>('/api/artboda/legal-documents', { query: { docType: activeDocType.value } })
  loading.value = false
}

watch(activeDocType, loadVersions)
onMounted(loadVersions)

// 이미 시행된 최신 버전을 그대로 복제해서 시작하면(제목/eyebrow/목차/블록 전부),
// 관리자가 매번 조항을 처음부터 새로 안 써도 되고 실수로 조항이 누락될 일도 줄어든다.
const draftTitle = ref('')
const draftEyebrow = ref('')
const draftEffectiveDate = ref('')
const draftToc = ref<{ id: string, label: string }[]>([])
const draftBlocks = ref<LegalBlock[]>([])

const startNewVersion = () => {
  const latest = versions.value[0]
  draftTitle.value = latest?.title ?? ''
  draftEyebrow.value = latest?.eyebrow ?? ''
  draftEffectiveDate.value = ''
  draftToc.value = latest ? structuredClone(latest.content.toc) : []
  draftBlocks.value = latest ? structuredClone(latest.content.blocks) : []
  showCreateForm.value = true
}

const addTocItem = () => {
  draftToc.value.push({ id: `toc-${Date.now().toString(36)}`, label: '' })
}
const removeTocItem = (index: number) => {
  draftToc.value.splice(index, 1)
}

const submitNewVersion = async () => {
  if (!draftTitle.value.trim() || !draftEyebrow.value.trim() || !draftEffectiveDate.value || draftBlocks.value.length === 0) {
    toast.add({ title: '제목/eyebrow/시행일/블록은 필수입니다.', color: 'error' })
    return
  }
  creating.value = true
  try {
    await $fetch('/api/artboda/legal-documents', {
      method: 'POST',
      body: {
        docType: activeDocType.value,
        effectiveDate: draftEffectiveDate.value,
        title: draftTitle.value,
        eyebrow: draftEyebrow.value,
        toc: draftToc.value,
        blocks: draftBlocks.value,
      },
    })
    toast.add({ title: '새 버전이 등록되었습니다.', color: 'success' })
    showCreateForm.value = false
    await loadVersions()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '등록에 실패했습니다.'
    toast.add({ title: message, color: 'error' })
  } finally {
    creating.value = false
  }
}

const columns = [
  { accessorKey: 'version', header: '버전' },
  { accessorKey: 'effective_date', header: '시행일' },
  { accessorKey: 'title', header: '제목' },
  { accessorKey: 'created_at', header: '등록일' },
]
</script>

<template>
  <div class="p-6 flex flex-col gap-4">
    <div class="flex gap-2">
      <UButton
        v-for="(label, docType) in docTypeLabels"
        :key="docType"
        :label="label"
        :variant="activeDocType === docType ? 'solid' : 'soft'"
        @click="activeDocType = docType"
      />
    </div>

    <AppDataTable
      :data="versions"
      :columns="columns"
      :loading="loading"
      search-placeholder="검색"
    >
      <template #effective_date-cell="{ row }">
        <span class="text-sm">{{ row.original.effective_date }}</span>
      </template>
      <template #created_at-cell="{ row }">
        <span class="text-xs text-muted">{{ new Date(row.original.created_at).toLocaleDateString('ko-KR') }}</span>
      </template>
    </AppDataTable>

    <UButton
      v-if="!showCreateForm"
      label="신규 버전 등록"
      icon="i-lucide-plus"
      class="self-start"
      @click="startNewVersion"
    />

    <UPageCard
      v-else
      title="신규 버전 등록"
    >
      <div class="flex flex-col gap-4">
        <p class="text-xs text-muted">
          이미 시행된 버전은 수정할 수 없습니다. 최신 버전을 복제해서 시작하며, 수정 후 새 시행일로 등록하세요.
        </p>

        <div class="flex gap-2">
          <UFormField
            label="제목"
            class="flex-1"
          >
            <UInput
              v-model="draftTitle"
              aria-label="제목"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Eyebrow"
            class="flex-1"
          >
            <UInput
              v-model="draftEyebrow"
              aria-label="eyebrow"
              class="w-full"
            />
          </UFormField>
          <UFormField label="시행일">
            <UInput
              v-model="draftEffectiveDate"
              type="date"
              aria-label="시행일"
            />
          </UFormField>
        </div>

        <UFormField label="목차">
          <div class="flex flex-col gap-2">
            <div
              v-for="(item, index) in draftToc"
              :key="item.id"
              class="flex gap-2"
            >
              <UInput
                v-model="item.label"
                aria-label="목차 항목"
                placeholder="목차 항목"
                class="flex-1"
              />
              <UButton
                icon="i-lucide-x"
                size="xs"
                variant="ghost"
                color="error"
                @click="removeTocItem(index)"
              />
            </div>
            <UButton
              label="목차 항목 추가"
              icon="i-lucide-plus"
              size="xs"
              variant="soft"
              class="self-start"
              @click="addTocItem"
            />
          </div>
        </UFormField>

        <LegalBlockEditor v-model="draftBlocks" />

        <div class="flex gap-2">
          <UButton
            label="등록"
            :loading="creating"
            @click="submitNewVersion"
          />
          <UButton
            label="취소"
            variant="ghost"
            color="neutral"
            @click="showCreateForm = false"
          />
        </div>
      </div>
    </UPageCard>
  </div>
</template>
