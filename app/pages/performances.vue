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

// ── 신규 등록 ────────────────────────────────────────────────
const showCreateForm = ref(false)
const creating = ref(false)

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
const draftImages = ref<string[]>([])
const createFormRef = useTemplateRef('createFormRef')

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
  draftImages.value = []
  showCreateForm.value = true
}

const submitNewPerformance = async () => {
  if (!draftName.value.trim() || !draftServiceId.value) {
    toast.add({ title: '이름/소유 서비스는 필수입니다.', color: 'error' })
    return
  }
  creating.value = true
  try {
    // 등록 시점엔 상품이 아직 없어서 이미지는 폼에 로컬로만 쌓여 있다(PerformancesImageUploader).
    // 상품을 먼저 만들고 productId를 받은 뒤에야 그 이미지들을 실제로 업로드할 수 있다.
    const { productId } = await $fetch<{ created: true, productId: string }>('/api/performances', {
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
    await createFormRef.value?.flushPendingUploads(productId)
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

// ── 수정 ────────────────────────────────────────────────────
// 등록 폼과 필드 구성이 완전히 같아서 PerformancesForm을 그대로 재사용 —
// 상태만 별도 ref로 두는 이유는 "수정 중 취소"가 등록 폼 상태를 건드리지 않게 하기 위함.
const showEditForm = ref(false)
const saving = ref(false)
const editingProductId = ref<string | null>(null)

const editName = ref('')
const editPrice = ref<number>(0)
const editCategory = ref('')
const editStatus = ref<ProductStatus>('draft')
const editServiceId = ref('')
const editExposedServiceIds = ref<string[]>([])
const editAudienceAge = ref('')
const editGenre = ref('')
const editDurationMinutes = ref<number | null>(null)
const editDescription = ref('')
const editPerformanceType = ref<PerformanceType | undefined>(undefined)
const editImages = ref<string[]>([])

const openEditForm = (row: PerformanceListItem) => {
  editingProductId.value = row.product_id
  editName.value = row.name
  editPrice.value = row.price
  editCategory.value = row.category ?? ''
  editStatus.value = row.status
  editServiceId.value = row.service_id
  editExposedServiceIds.value = [...row.exposed_service_ids]
  editAudienceAge.value = row.audience_age ?? ''
  editGenre.value = row.genre ?? ''
  editDurationMinutes.value = row.duration_minutes
  editDescription.value = row.description ?? ''
  editPerformanceType.value = row.performance_type ?? undefined
  editImages.value = [...(row.images ?? [])]
  showEditForm.value = true
}

const submitEditPerformance = async () => {
  if (!editingProductId.value || !editName.value.trim() || !editServiceId.value) {
    toast.add({ title: '이름/소유 서비스는 필수입니다.', color: 'error' })
    return
  }
  saving.value = true
  try {
    await $fetch(`/api/performances/${editingProductId.value}`, {
      method: 'PATCH',
      body: {
        name: editName.value,
        price: editPrice.value,
        category: editCategory.value || undefined,
        status: editStatus.value,
        serviceId: editServiceId.value,
        exposedServiceIds: editExposedServiceIds.value,
        audienceAge: editAudienceAge.value || undefined,
        genre: editGenre.value || undefined,
        durationMinutes: editDurationMinutes.value ?? undefined,
        description: editDescription.value || undefined,
        performanceType: editPerformanceType.value,
        images: editImages.value,
      },
    })
    toast.add({ title: '공연작품이 수정되었습니다.', color: 'success' })
    showEditForm.value = false
    await loadItems()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '수정에 실패했습니다.'
    toast.add({ title: message, color: 'error' })
  } finally {
    saving.value = false
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
      artboda·stub 등 여러 서비스의 공연작품을 한곳에서 관리합니다. 본인이 관리하는 서비스에 노출된 항목만 보입니다. 행을 클릭하면 수정할 수 있습니다.
    </p>

    <AppDataTable
      :data="items"
      :columns="columns"
      :loading="loading"
      search-placeholder="검색"
      :search-keys="['name']"
    >
      <template #service_id-cell="{ row }">
        <button
          type="button"
          class="text-sm text-left w-full cursor-pointer"
          @click="openEditForm(row.original)"
        >
          {{ serviceName(row.original.service_id) }}
        </button>
      </template>
      <template #name-cell="{ row }">
        <button
          type="button"
          class="text-sm text-left w-full cursor-pointer text-highlighted hover:underline"
          @click="openEditForm(row.original)"
        >
          {{ row.original.name }}
        </button>
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
        <PerformancesForm
          ref="createFormRef"
          v-model:name="draftName"
          v-model:price="draftPrice"
          v-model:category="draftCategory"
          v-model:service-id="draftServiceId"
          v-model:exposed-service-ids="draftExposedServiceIds"
          v-model:audience-age="draftAudienceAge"
          v-model:genre="draftGenre"
          v-model:duration-minutes="draftDurationMinutes"
          v-model:description="draftDescription"
          v-model:performance-type="draftPerformanceType"
          v-model:images="draftImages"
          :services="services"
          :product-id="null"
        />

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

    <USlideover
      v-model:open="showEditForm"
      title="공연작품 수정"
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <div class="flex flex-col gap-4">
          <UFormField label="상태">
            <USelect
              v-model="editStatus"
              :items="[{ label: '초안', value: 'draft' }, { label: '게시', value: 'published' }, { label: '차단', value: 'blocked' }]"
              aria-label="상태"
            />
          </UFormField>

          <PerformancesForm
            v-model:name="editName"
            v-model:price="editPrice"
            v-model:category="editCategory"
            v-model:service-id="editServiceId"
            v-model:exposed-service-ids="editExposedServiceIds"
            v-model:audience-age="editAudienceAge"
            v-model:genre="editGenre"
            v-model:duration-minutes="editDurationMinutes"
            v-model:description="editDescription"
            v-model:performance-type="editPerformanceType"
            v-model:images="editImages"
            :services="services"
            :product-id="editingProductId"
          />

          <div class="flex gap-2">
            <UButton
              label="저장"
              :loading="saving"
              @click="submitEditPerformance"
            />
            <UButton
              label="취소"
              variant="ghost"
              color="neutral"
              @click="showEditForm = false"
            />
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>
