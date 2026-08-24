<script setup lang="ts">
definePageMeta({ layout: 'default', title: '아트보다 · 문의 관리' })

interface Inquiry {
  id: string
  reference_code: string
  contact_name: string | null
  contact_department: string | null
  contact_email: string | null
  desired_schedule: string | null
  venue: string | null
  target_audience: string | null
  expected_audience: number | null
  performance_count: number | null
  budget_range: string | null
  requested_documents: Record<string, unknown> | null
  agreed_to_privacy: boolean
  status: 'submitted' | 'quoted' | 'converted' | 'closed'
  created_at: string
}

const supabase = useSupabaseClient()
const toast = useToast()

const inquiries = ref<Inquiry[]>([])
const loading = ref(false)
const selected = ref<Inquiry | null>(null)
const convertOrgId = ref<string | undefined>(undefined)
const organizations = ref<{ label: string, value: string }[]>([])
const busy = ref(false)

const statusLabels: Record<Inquiry['status'], string> = {
  submitted: '접수',
  quoted: '견적발송',
  converted: '계약전환',
  closed: '종료',
}
const statusColors: Record<Inquiry['status'], 'warning' | 'info' | 'success' | 'neutral'> = {
  submitted: 'warning',
  quoted: 'info',
  converted: 'success',
  closed: 'neutral',
}

const statusFilter = ref<Inquiry['status'] | undefined>(undefined)
const statusFilterOptions = Object.entries(statusLabels).map(([value, label]) => ({ label, value }))
const filtered = computed(() => statusFilter.value ? inquiries.value.filter(i => i.status === statusFilter.value) : inquiries.value)

const loadInquiries = async () => {
  loading.value = true
  inquiries.value = await $fetch<Inquiry[]>('/api/artboda/inquiries')
  loading.value = false
}

const loadOrganizations = async () => {
  const { data } = await supabase.schema('artboda').from('organizations').select('id, name').eq('deleted', false)
  organizations.value = (data ?? []).map(o => ({ label: o.name, value: o.id }))
}

onMounted(async () => {
  await Promise.all([loadInquiries(), loadOrganizations()])
})

const openDetail = (inquiry: Inquiry) => {
  selected.value = inquiry
  convertOrgId.value = undefined
}

const sendQuote = async (inquiry: Inquiry) => {
  busy.value = true
  await $fetch(`/api/artboda/inquiries/${inquiry.id}/quote`, { method: 'POST' })
  busy.value = false
  toast.add({ title: '견적 회신 처리되었습니다.', color: 'success' })
  selected.value = null
  await loadInquiries()
}

const convertToContract = async (inquiry: Inquiry) => {
  if (!convertOrgId.value) {
    toast.add({ title: '기관을 선택해주세요.', color: 'error' })
    return
  }
  busy.value = true
  await $fetch(`/api/artboda/inquiries/${inquiry.id}/convert`, { method: 'POST', body: { organizationId: convertOrgId.value } })
  busy.value = false
  toast.add({ title: '계약으로 전환되었습니다.', color: 'success' })
  selected.value = null
  await loadInquiries()
}

const searchInquiry = (row: Record<string, unknown>, query: string) => {
  const inquiry = row as unknown as Inquiry
  return inquiry.reference_code.toLowerCase().includes(query)
    || (inquiry.contact_name?.toLowerCase().includes(query) ?? false)
}

const columns = [
  { accessorKey: 'reference_code', header: '문의번호' },
  { accessorKey: 'contact', header: '담당자' },
  { accessorKey: 'desired_schedule', header: '희망일정' },
  { accessorKey: 'venue', header: '장소' },
  { accessorKey: 'status', header: '상태' },
  { accessorKey: 'created_at', header: '신청일' },
  { accessorKey: 'actions', header: '' },
]
</script>

<template>
  <div class="p-6 flex flex-col gap-4">
    <AppDataTable
      :data="filtered"
      :columns="columns"
      :loading="loading"
      :search-fn="searchInquiry"
      search-placeholder="문의번호/담당자 검색"
    >
      <template #filters>
        <USelect
          v-model="statusFilter"
          :items="statusFilterOptions"
          value-key="value"
          aria-label="상태 필터"
          placeholder="상태로 필터"
          class="w-32"
        />
        <UButton
          v-if="statusFilter"
          label="필터 해제"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="statusFilter = undefined"
        />
      </template>

      <template #contact-cell="{ row }">
        <div class="flex flex-col">
          <span class="text-sm">{{ row.original.contact_name }}</span>
          <span class="text-xs text-muted">{{ row.original.contact_department }}</span>
        </div>
      </template>

      <template #desired_schedule-cell="{ row }">
        <span class="text-sm">{{ row.original.desired_schedule ? new Date(row.original.desired_schedule).toLocaleDateString('ko-KR') : '-' }}</span>
      </template>

      <template #status-cell="{ row }">
        <UBadge
          :label="statusLabels[row.original.status as Inquiry['status']]"
          :color="statusColors[row.original.status as Inquiry['status']]"
          variant="subtle"
        />
      </template>

      <template #created_at-cell="{ row }">
        <span class="text-xs text-muted">{{ new Date(row.original.created_at).toLocaleDateString('ko-KR') }}</span>
      </template>

      <template #actions-cell="{ row }">
        <UButton
          label="상세"
          size="xs"
          variant="soft"
          @click="openDetail(row.original)"
        />
      </template>
    </AppDataTable>

    <USlideover
      v-if="selected"
      :open="!!selected"
      title="문의 상세"
      @update:open="selected = null"
    >
      <template #body>
        <div
          v-if="selected"
          class="flex flex-col gap-3"
        >
          <div class="text-sm">
            <span class="text-muted">문의번호</span> {{ selected.reference_code }}
          </div>
          <div class="text-sm">
            <span class="text-muted">이메일</span> {{ selected.contact_email ?? '-' }}
          </div>
          <div class="text-sm">
            <span class="text-muted">대상</span> {{ selected.target_audience ?? '-' }} / 예상 {{ selected.expected_audience ?? '-' }}명
          </div>
          <div class="text-sm">
            <span class="text-muted">공연 횟수</span> {{ selected.performance_count ?? '-' }}
          </div>
          <div class="text-sm">
            <span class="text-muted">예산범위</span> {{ selected.budget_range ?? '-' }}
          </div>
          <div class="text-sm">
            <span class="text-muted">요청 서류</span> {{ selected.requested_documents ? JSON.stringify(selected.requested_documents) : '-' }}
          </div>
          <div class="text-sm">
            <span class="text-muted">개인정보 동의</span> {{ selected.agreed_to_privacy ? '동의' : '미동의' }}
          </div>

          <UButton
            v-if="selected.status === 'submitted'"
            label="견적 회신"
            :loading="busy"
            @click="sendQuote(selected)"
          />

          <template v-if="selected.status === 'quoted'">
            <USelect
              v-model="convertOrgId"
              :items="organizations"
              value-key="value"
              aria-label="기관"
              placeholder="기관 선택"
            />
            <UButton
              label="계약 전환"
              :loading="busy"
              @click="convertToContract(selected)"
            />
          </template>
        </div>
      </template>
    </USlideover>
  </div>
</template>
