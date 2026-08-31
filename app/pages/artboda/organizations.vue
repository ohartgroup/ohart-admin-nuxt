<script setup lang="ts">
definePageMeta({ layout: 'default', title: '아트보다 · 기관 관리' })

interface Organization {
  id: string
  name: string
  org_type: string
  business_registration_number: string | null
  address: string | null
  contract_started_at: string | null
  billing_email: string | null
  created_at: string
}

const supabase = useSupabaseClient()
const toast = useToast()

const orgTypeLabels: Record<string, string> = {
  kindergarten: '유치원',
  school: '학교',
  library: '도서관',
  company: '기업',
  individual_business: '개인사업자',
  other: '기타',
}
const orgTypeOptions = Object.entries(orgTypeLabels).map(([value, label]) => ({ label, value }))

const organizations = ref<Organization[]>([])
const loading = ref(false)
const showCreateForm = ref(false)
const creating = ref(false)
const newOrg = reactive({ name: '', orgType: 'company', businessRegistrationNumber: '', address: '', billingEmail: '' })

const loadOrganizations = async () => {
  loading.value = true
  organizations.value = await $fetch<Organization[]>('/api/artboda/organizations')
  loading.value = false
}

onMounted(loadOrganizations)

const createOrganization = async () => {
  if (!newOrg.name.trim()) {
    return
  }
  creating.value = true
  await $fetch('/api/artboda/organizations', { method: 'POST', body: newOrg })
  creating.value = false
  showCreateForm.value = false
  Object.assign(newOrg, { name: '', orgType: 'company', businessRegistrationNumber: '', address: '', billingEmail: '' })
  toast.add({ title: '기관이 등록되었습니다.', color: 'success' })
  await loadOrganizations()
}

const decryptPhone = (organizationId: string) => async () => {
  const { data, error } = await supabase.schema('artboda').rpc('decrypt_organization_phone', { p_organization_id: organizationId })
  if (error) {
    return null
  }
  return data
}

const searchOrg = (row: Record<string, unknown>, query: string) => {
  const org = row as unknown as Organization
  return org.name.toLowerCase().includes(query)
}

const columns = [
  { accessorKey: 'name', header: '기관명' },
  { accessorKey: 'org_type', header: '유형' },
  { accessorKey: 'business_registration_number', header: '사업자번호' },
  { accessorKey: 'phone', header: '전화번호' },
  { accessorKey: 'contract_started_at', header: '계약시작일' },
  { accessorKey: 'billing_email', header: '청구 이메일' },
]
</script>

<template>
  <div class="p-6 flex flex-col gap-4">
    <UPageCard title="기관 등록">
      <UButton
        v-if="!showCreateForm"
        label="새 기관 추가"
        icon="i-lucide-plus"
        @click="showCreateForm = true"
      />
      <div
        v-else
        class="flex flex-col gap-3"
      >
        <div class="flex gap-2">
          <UInput
            v-model="newOrg.name"
            aria-label="기관명"
            placeholder="기관명"
            class="flex-1"
          />
          <USelect
            v-model="newOrg.orgType"
            :items="orgTypeOptions"
            value-key="value"
            aria-label="유형"
            class="w-40"
          />
        </div>
        <div class="flex gap-2">
          <UInput
            v-model="newOrg.businessRegistrationNumber"
            aria-label="사업자번호"
            placeholder="사업자번호(선택)"
            class="flex-1"
          />
          <UInput
            v-model="newOrg.billingEmail"
            aria-label="청구 이메일"
            placeholder="청구 이메일(선택)"
            class="flex-1"
          />
        </div>
        <UInput
          v-model="newOrg.address"
          aria-label="주소"
          placeholder="주소(선택)"
        />
        <div class="flex gap-2">
          <UButton
            label="등록"
            :loading="creating"
            @click="createOrganization"
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

    <AppDataTable
      :data="organizations"
      :columns="columns"
      :loading="loading"
      :search-fn="searchOrg"
      search-placeholder="기관명 검색"
    >
      <template #org_type-cell="{ row }">
        <span class="text-sm">{{ orgTypeLabels[row.original.org_type] ?? row.original.org_type }}</span>
      </template>

      <template #phone-cell="{ row }">
        <MaskedPhone :decrypt="decryptPhone(row.original.id)" />
      </template>

      <template #contract_started_at-cell="{ row }">
        <span class="text-sm">{{ row.original.contract_started_at ?? '-' }}</span>
      </template>
    </AppDataTable>
  </div>
</template>
