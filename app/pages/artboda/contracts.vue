<script setup lang="ts">
definePageMeta({ layout: 'default', title: '아트보다 · 계약 관리' })

interface Contract {
  id: string
  organizationName: string | null
  inquiryId: string
  hasPayment: boolean
  contractNumber: string | null
  signedAt: string | null
  status: 'draft' | 'pending_payment' | 'active' | 'completed' | 'canceled'
  totalAmount: number | null
  bookingCount: number
  createdAt: string
}

const toast = useToast()

const statusLabels: Record<Contract['status'], string> = {
  draft: '초안',
  pending_payment: '결제대기',
  active: '진행중',
  completed: '완료',
  canceled: '취소',
}
const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({ label, value }))

const contracts = ref<Contract[]>([])
const loading = ref(false)
const updating = ref<Record<string, boolean>>({})

const loadContracts = async () => {
  loading.value = true
  contracts.value = await $fetch<Contract[]>('/api/artboda/contracts')
  loading.value = false
}

onMounted(loadContracts)

const updateStatus = async (contract: Contract, status: Contract['status']) => {
  if (status === contract.status) {
    return
  }
  updating.value[contract.id] = true
  await $fetch(`/api/artboda/contracts/${contract.id}/status`, { method: 'POST', body: { status } })
  updating.value[contract.id] = false
  toast.add({ title: '계약 상태가 변경되었습니다.', color: 'success' })
  await loadContracts()
}

const searchContract = (row: Record<string, unknown>, query: string) => {
  const contract = row as unknown as Contract
  return (contract.contractNumber?.toLowerCase().includes(query) ?? false)
    || (contract.organizationName?.toLowerCase().includes(query) ?? false)
}

const columns = [
  { accessorKey: 'contractNumber', header: '계약번호' },
  { accessorKey: 'organizationName', header: '소속 기관' },
  { accessorKey: 'signedAt', header: '체결일' },
  { accessorKey: 'status', header: '상태' },
  { accessorKey: 'totalAmount', header: '총액' },
  { accessorKey: 'hasPayment', header: '결제' },
  { accessorKey: 'bookingCount', header: '예약' },
]
</script>

<template>
  <div class="p-6">
    <AppDataTable
      :data="contracts"
      :columns="columns"
      :loading="loading"
      :search-fn="searchContract"
      search-placeholder="계약번호/기관명 검색"
    >
      <template #contractNumber-cell="{ row }">
        <span class="text-sm font-medium">{{ row.original.contractNumber ?? '(미발급)' }}</span>
      </template>

      <template #signedAt-cell="{ row }">
        <span class="text-sm">{{ row.original.signedAt ?? '-' }}</span>
      </template>

      <template #status-cell="{ row }">
        <USelect
          :model-value="row.original.status"
          :items="statusOptions"
          value-key="value"
          aria-label="계약 상태"
          class="w-36"
          :loading="updating[row.original.id]"
          @update:model-value="(value) => updateStatus(row.original, value as typeof row.original.status)"
        />
      </template>

      <template #totalAmount-cell="{ row }">
        <span class="text-sm">{{ row.original.totalAmount != null ? row.original.totalAmount.toLocaleString('ko-KR') + '원' : '-' }}</span>
      </template>

      <template #hasPayment-cell="{ row }">
        <UBadge
          :label="row.original.hasPayment ? '연결됨' : '미연결'"
          :color="row.original.hasPayment ? 'success' : 'neutral'"
          variant="subtle"
        />
      </template>
    </AppDataTable>
  </div>
</template>
