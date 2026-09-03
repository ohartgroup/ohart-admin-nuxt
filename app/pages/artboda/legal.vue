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
  try {
    versions.value = await $fetch<LegalDocumentVersion[]>('/api/artboda/legal-documents', { query: { docType: activeDocType.value } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '목록을 불러오지 못했습니다.'
    toast.add({ title: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

watch(activeDocType, loadVersions)
onMounted(loadVersions)

// 이미 시행된 최신 버전을 그대로 복제해서 시작하면(제목/eyebrow/블록 전부),
// 관리자가 매번 조항을 처음부터 새로 안 써도 되고 실수로 조항이 누락될 일도 줄어든다.
const draftTitle = ref('')
const draftEyebrow = ref('')
const draftEffectiveDate = ref('')
const draftBlocks = ref<LegalBlock[]>([])

// versions.value의 항목은 Vue reactive proxy라 structuredClone에 그대로 넘기면
// "could not be cloned" 에러가 난다. content는 jsonb라 JSON round-trip으로 안전하게 복제한다.
function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

const startNewVersion = () => {
  const latest = versions.value[0]
  draftTitle.value = latest?.title ?? ''
  draftEyebrow.value = latest?.eyebrow ?? ''
  draftEffectiveDate.value = ''
  draftBlocks.value = latest ? cloneJson(latest.content.blocks) : []
  showCreateForm.value = true
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
  { id: 'preview', header: '' },
]

// 미리보기는 등록된 버전(행 클릭)과 등록 폼 초안(draft) 둘 다에서 쓴다.
// 실제 사용자 화면(artboda-web-nuxt terms.vue/privacy.vue)과 동일한 컴포넌트(LegalHero/Toc/Article/Table)로
// 렌더링해서, 저장 전에 실제 레이아웃이 어떻게 보일지 그대로 확인할 수 있게 한다.
const showPreview = ref(false)
const previewSource = ref<{ eyebrow: string, title: string, effectiveDate: string, blocks: LegalBlock[] } | null>(null)

const previewVersion = (row: LegalDocumentVersion) => {
  previewSource.value = {
    eyebrow: row.eyebrow,
    title: row.title,
    effectiveDate: row.effective_date,
    blocks: row.content.blocks,
  }
  showPreview.value = true
}

const previewDraft = () => {
  previewSource.value = {
    eyebrow: draftEyebrow.value,
    title: draftTitle.value,
    effectiveDate: draftEffectiveDate.value,
    blocks: draftBlocks.value,
  }
  showPreview.value = true
}
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
      <template #preview-cell="{ row }">
        <UButton
          label="미리보기"
          icon="i-lucide-eye"
          size="xs"
          variant="ghost"
          color="neutral"
          @click="previewVersion(row.original)"
        />
      </template>
    </AppDataTable>

    <UButton
      label="신규 버전 등록"
      icon="i-lucide-plus"
      class="self-start"
      @click="startNewVersion"
    />

    <AppFormDialog
      v-model:open="showCreateForm"
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

        <LegalBlockEditor v-model="draftBlocks" />

        <div class="flex gap-2">
          <UButton
            label="등록"
            :loading="creating"
            @click="submitNewVersion"
          />
          <UButton
            label="미리보기"
            icon="i-lucide-eye"
            variant="soft"
            color="neutral"
            @click="previewDraft"
          />
          <UButton
            label="취소"
            variant="ghost"
            color="neutral"
            @click="showCreateForm = false"
          />
        </div>
      </div>
    </AppFormDialog>

    <USlideover
      v-model:open="showPreview"
      title="미리보기"
      :description="previewSource ? `${docTypeLabels[activeDocType]} · 시행일 ${previewSource.effectiveDate || '미지정'}` : ''"
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <LegalPreviewPanel
          v-if="previewSource"
          :eyebrow="previewSource.eyebrow"
          :title="previewSource.title"
          :meta="`시행일 ${previewSource.effectiveDate || '미지정'}`"
          :blocks="previewSource.blocks"
        />
      </template>
    </USlideover>
  </div>
</template>
