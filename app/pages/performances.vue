<script setup lang="ts">
import type { PerformanceListItem, PerformanceType, ProductStatus } from '~/types/performance'

definePageMeta({ layout: 'default', title: '공연작품 관리' })

const toast = useToast()
const supabase = useSupabaseClient()

const performanceTypeLabels: Record<PerformanceType, string> = { direct: '직접제작', brokered: '중개' }
const statusLabels: Record<ProductStatus, string> = { draft: '초안', published: '게시', blocked: '차단' }

const services = ref<{ id: string, name: string }[]>([])
const serviceName = (id: string) => services.value.find(s => s.id === id)?.name ?? id

const items = ref<PerformanceListItem[]>([])
const loading = ref(false)
const showCreateForm = ref(false)
const creating = ref(false)

const loadServices = async () => {
  const { data } = await supabase.from('services').select('id, name').eq('deleted', false)
  services.value = data ?? []
}

const loadItems = async () => {
  loading.value = true
  try {
    items.value = await $fetch<PerformanceListItem[]>('/api/performances')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '목록을 불러오지 못했습니다.'
    toast.add({ title: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadServices()
  loadItems()
})

const draftName = ref('')
const draftPrice = ref<number>(0)
const draftCategory = ref('')
const draftServiceId = ref('')
const draftExposedServiceIds = ref<string[]>([])
const draftAudienceAge = ref('')
const draftGenre = ref('')
const draftDurationMinutes = ref<number | null>(null)
const draftDescription = ref('')
const draftPerformanceType = ref<PerformanceType | undefined>(undefined)

const toggleExposedService = (id: string) => {
  const index = draftExposedServiceIds.value.indexOf(id)
  if (index === -1) {
    draftExposedServiceIds.value.push(id)
  } else {
    draftExposedServiceIds.value.splice(index, 1)
  }
}

const startNewPerformance = () => {
  draftName.value = ''
  draftPrice.value = 0
  draftCategory.value = ''
  draftServiceId.value = services.value[0]?.id ?? ''
  draftExposedServiceIds.value = draftServiceId.value ? [draftServiceId.value] : []
  draftAudienceAge.value = ''
  draftGenre.value = ''
  draftDurationMinutes.value = null
  draftDescription.value = ''
  draftPerformanceType.value = undefined
  showCreateForm.value = true
}

const submitNewPerformance = async () => {
  if (!draftName.value.trim() || !draftServiceId.value) {
    toast.add({ title: '이름/소유 서비스는 필수입니다.', color: 'error' })
    return
  }
  creating.value = true
  try {
    await $fetch('/api/performances', {
      method: 'POST',
      body: {
        name: draftName.value,
        price: draftPrice.value,
        category: draftCategory.value || undefined,
        serviceId: draftServiceId.value,
        exposedServiceIds: draftExposedServiceIds.value,
        audienceAge: draftAudienceAge.value || undefined,
        genre: draftGenre.value || undefined,
        durationMinutes: draftDurationMinutes.value ?? undefined,
        description: draftDescription.value || undefined,
        performanceType: draftPerformanceType.value,
      },
    })
    toast.add({ title: '공연작품이 등록되었습니다.', color: 'success' })
    showCreateForm.value = false
    await loadItems()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '등록에 실패했습니다.'
    toast.add({ title: message, color: 'error' })
  } finally {
    creating.value = false
  }
}

const columns = [
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'service_id', header: '소유 서비스' },
  { id: 'exposed', header: '노출 서비스' },
  { accessorKey: 'performance_type', header: '공연구분' },
  { accessorKey: 'status', header: '상태' },
]
</script>

<template>
  <div class="p-6 flex flex-col gap-4">
    <p class="text-sm text-muted">
      artboda·stub 등 여러 서비스의 공연작품을 한곳에서 관리합니다. 본인이 관리하는 서비스에 노출된 항목만 보입니다.
    </p>

    <AppDataTable
      :data="items"
      :columns="columns"
      :loading="loading"
      search-placeholder="검색"
      :search-keys="['name']"
    >
      <template #service_id-cell="{ row }">
        <span class="text-sm">{{ serviceName(row.original.service_id) }}</span>
      </template>
      <template #exposed-cell="{ row }">
        <div class="flex flex-wrap gap-1">
          <UBadge
            v-for="id in row.original.exposed_service_ids"
            :key="id"
            :label="serviceName(id)"
            variant="subtle"
            color="neutral"
            size="sm"
          />
        </div>
      </template>
      <template #performance_type-cell="{ row }">
        <span class="text-sm">{{ row.original.performance_type ? performanceTypeLabels[row.original.performance_type as PerformanceType] : '-' }}</span>
      </template>
      <template #status-cell="{ row }">
        <UBadge
          :label="statusLabels[row.original.status as ProductStatus]"
          variant="subtle"
        />
      </template>
    </AppDataTable>

    <UButton
      v-if="!showCreateForm"
      label="신규 등록"
      icon="i-lucide-plus"
      class="self-start"
      @click="startNewPerformance"
    />

    <UPageCard
      v-else
      title="신규 공연작품 등록"
    >
      <div class="flex flex-col gap-4">
        <div class="flex gap-2">
          <UFormField
            label="이름"
            class="flex-1"
          >
            <UInput
              v-model="draftName"
              aria-label="이름"
              class="w-full"
            />
          </UFormField>
          <UFormField label="가격">
            <UInput
              v-model.number="draftPrice"
              type="number"
              aria-label="가격"
            />
          </UFormField>
          <UFormField label="카테고리">
            <UInput
              v-model="draftCategory"
              aria-label="카테고리"
            />
          </UFormField>
        </div>

        <UFormField label="소유 서비스 (내부 관리 권한 기준)">
          <USelect
            v-model="draftServiceId"
            :items="services.map(s => ({ label: s.name, value: s.id }))"
            aria-label="소유 서비스"
          />
        </UFormField>

        <UFormField label="노출 서비스 (복수 선택 가능)">
          <div class="flex gap-3">
            <UCheckbox
              v-for="service in services"
              :key="service.id"
              :model-value="draftExposedServiceIds.includes(service.id)"
              :label="service.name"
              @update:model-value="toggleExposedService(service.id)"
            />
          </div>
        </UFormField>

        <div class="flex gap-2">
          <UFormField
            label="관객 연령대"
            class="flex-1"
          >
            <UInput
              v-model="draftAudienceAge"
              aria-label="관객 연령대"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="장르"
            class="flex-1"
          >
            <UInput
              v-model="draftGenre"
              aria-label="장르"
              class="w-full"
            />
          </UFormField>
          <UFormField label="러닝타임(분)">
            <UInput
              v-model.number="draftDurationMinutes"
              type="number"
              aria-label="러닝타임"
            />
          </UFormField>
          <UFormField label="공연구분">
            <USelect
              v-model="draftPerformanceType"
              :items="[{ label: '직접제작', value: 'direct' }, { label: '중개', value: 'brokered' }]"
              aria-label="공연구분"
            />
          </UFormField>
        </div>

        <UFormField label="설명">
          <UTextarea
            v-model="draftDescription"
            class="w-full"
          />
        </UFormField>

        <div class="flex gap-2">
          <UButton
            label="등록"
            :loading="creating"
            @click="submitNewPerformance"
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
