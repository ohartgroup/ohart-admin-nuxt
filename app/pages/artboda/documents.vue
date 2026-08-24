<script setup lang="ts">
definePageMeta({ layout: 'default', title: '아트보다 · 증빙 발급 관리' })

interface PaymentDocument {
  id: string
  payment_id: string
  contract_id: string | null
  document_type: 'quote' | 'contract' | 'transaction_statement' | 'receipt' | 'tax_invoice'
  status: 'generated' | 'requested'
  file_url: string | null
  issued_at: string | null
  created_at: string
}

const toast = useToast()

const typeLabels: Record<PaymentDocument['document_type'], string> = {
  quote: '견적서',
  contract: '계약서',
  transaction_statement: '거래명세서',
  receipt: '영수증',
  tax_invoice: '세금계산서',
}

const documents = ref<PaymentDocument[]>([])
const loading = ref(false)
const issuing = ref<Record<string, boolean>>({})

const loadDocuments = async () => {
  loading.value = true
  documents.value = await $fetch<PaymentDocument[]>('/api/artboda/documents')
  loading.value = false
}

onMounted(loadDocuments)

const issue = async (doc: PaymentDocument) => {
  issuing.value[doc.id] = true
  await $fetch(`/api/artboda/documents/${doc.id}/issue`, { method: 'POST' })
  issuing.value[doc.id] = false
  toast.add({ title: '증빙이 발급되었습니다.', color: 'success' })
  await loadDocuments()
}

const searchDoc = (row: Record<string, unknown>, query: string) => {
  const doc = row as unknown as PaymentDocument
  return typeLabels[doc.document_type].toLowerCase().includes(query)
}

const columns = [
  { accessorKey: 'document_type', header: '유형' },
  { accessorKey: 'status', header: '상태' },
  { accessorKey: 'issued_at', header: '발급일' },
  { accessorKey: 'file_url', header: '파일' },
  { accessorKey: 'actions', header: '' },
]
</script>

<template>
  <div class="p-6">
    <AppDataTable
      :data="documents"
      :columns="columns"
      :loading="loading"
      :search-fn="searchDoc"
      search-placeholder="문서유형 검색"
    >
      <template #document_type-cell="{ row }">
        <span class="text-sm">{{ typeLabels[row.original.document_type as PaymentDocument['document_type']] }}</span>
      </template>

      <template #status-cell="{ row }">
        <UBadge
          :label="row.original.status === 'generated' ? '발급완료' : '요청됨'"
          :color="row.original.status === 'generated' ? 'success' : 'warning'"
          variant="subtle"
        />
      </template>

      <template #issued_at-cell="{ row }">
        <span class="text-sm">{{ row.original.issued_at ? new Date(row.original.issued_at).toLocaleDateString('ko-KR') : '-' }}</span>
      </template>

      <template #file_url-cell="{ row }">
        <a
          v-if="row.original.file_url"
          :href="row.original.file_url"
          target="_blank"
          class="text-sm text-primary underline"
        >다운로드</a>
        <span
          v-else
          class="text-sm text-muted"
        >-</span>
      </template>

      <template #actions-cell="{ row }">
        <UButton
          v-if="row.original.status === 'requested'"
          label="발급"
          size="xs"
          :loading="issuing[row.original.id]"
          @click="issue(row.original)"
        />
      </template>
    </AppDataTable>
  </div>
</template>
