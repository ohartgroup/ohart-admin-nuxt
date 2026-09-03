<script setup lang="ts">
import type { PerformanceListItem, PerformanceType, ProductStatus } from '~/types/performance'

definePageMeta({ layout: 'default', title: '공연작품 관리' })

const toast = useToast()
const supabase = useSupabaseClient()

const performanceTypeLabels: Record<PerformanceType, string> = { direct: '직접제작', brokered: '중개' }
const statusLabels: Record<ProductStatus, string> = { draft: '초안', published: '게시', blocked: '차단' }

const services = ref<{ id: string, name: string }[]>([])
const serviceName = (id: string) => services.value.find(s => s.id === id)?.name ?? id

const categories = ref<{ id: string, label: string }[]>([])
const genres = ref<{ id: string, label: string }[]>([])

const items = ref<PerformanceListItem[]>([])
const loading = ref(false)
// 오작동 삭제 대비 — 켜면 deleted=true인 공연작품도 같이 불러와서 복구할 수 있게 한다.
const showDeleted = ref(false)

const loadServices = async () => {
  const { data } = await supabase.from('services').select('id, name').eq('deleted', false)
  services.value = data ?? []
}

// 카테고리/장르 선택지 — /catalog-taxonomies(super_admin 전용 관리화면)에서 관리되는 값을
// public_read RLS로 그대로 읽어온다(서비스 목록과 동일한 패턴).
const loadTaxonomies = async () => {
  const { data } = await supabase.from('catalog_taxonomies').select('id, type, label').eq('deleted', false).eq('activated', true).order('sort_order').order('label')
  categories.value = (data ?? []).filter(t => t.type === 'category').map(t => ({ id: t.id, label: t.label }))
  genres.value = (data ?? []).filter(t => t.type === 'genre').map(t => ({ id: t.id, label: t.label }))
}

const loadItems = async () => {
  loading.value = true
  try {
    items.value = await $fetch<PerformanceListItem[]>('/api/performances', {
      query: { includeDeleted: showDeleted.value ? 'true' : undefined },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '목록을 불러오지 못했습니다.'
    toast.add({ title: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

watch(showDeleted, loadItems)

onMounted(() => {
  loadServices()
  loadTaxonomies()
  loadItems()
})

// ── 신규 등록 ────────────────────────────────────────────────
const showCreateForm = ref(false)
const creating = ref(false)

const draftName = ref('')
const draftPrice = ref<number>(0)
const draftCategoryId = ref<string | undefined>(undefined)
const draftServiceId = ref('')
const draftExposedServiceIds = ref<string[]>([])
const draftAudienceAge = ref('')
const draftGenreId = ref<string | undefined>(undefined)
const draftDurationMinutes = ref<number | null>(null)
const draftDescription = ref('')
const draftPerformanceType = ref<PerformanceType | undefined>(undefined)
const draftImages = ref<string[]>([])
const createFormRef = useTemplateRef('createFormRef')

const startNewPerformance = () => {
  draftName.value = ''
  draftPrice.value = 0
  draftCategoryId.value = undefined
  draftServiceId.value = services.value[0]?.id ?? ''
  draftExposedServiceIds.value = draftServiceId.value ? [draftServiceId.value] : []
  draftAudienceAge.value = ''
  draftGenreId.value = undefined
  draftDurationMinutes.value = null
  draftDescription.value = ''
  draftPerformanceType.value = undefined
  draftImages.value = []
  showCreateForm.value = true
}

const submitNewPerformance = async () => {
  if (!createFormRef.value?.validate()) {
    toast.add({ title: '필수 항목을 모두 입력해주세요.', color: 'error' })
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
        categoryId: draftCategoryId.value,
        serviceId: draftServiceId.value,
        exposedServiceIds: draftExposedServiceIds.value,
        audienceAge: draftAudienceAge.value || undefined,
        genreId: draftGenreId.value,
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
const editCategoryId = ref<string | undefined>(undefined)
const editStatus = ref<ProductStatus>('draft')
const editServiceId = ref('')
const editExposedServiceIds = ref<string[]>([])
const editAudienceAge = ref('')
const editGenreId = ref<string | undefined>(undefined)
const editDurationMinutes = ref<number | null>(null)
const editDescription = ref('')
const editPerformanceType = ref<PerformanceType | undefined>(undefined)
const editImages = ref<string[]>([])
const editFormRef = useTemplateRef('editFormRef')

const openEditForm = (row: PerformanceListItem) => {
  editingProductId.value = row.product_id
  editName.value = row.name
  editPrice.value = row.price
  editCategoryId.value = row.category_id ?? undefined
  editStatus.value = row.status
  editServiceId.value = row.service_id
  editExposedServiceIds.value = [...row.exposed_service_ids]
  editAudienceAge.value = row.audience_age ?? ''
  editGenreId.value = row.genre_id ?? undefined
  editDurationMinutes.value = row.duration_minutes
  editDescription.value = row.description ?? ''
  editPerformanceType.value = row.performance_type ?? undefined
  editImages.value = [...(row.images ?? [])]
  showEditForm.value = true
}

const submitEditPerformance = async () => {
  if (!editingProductId.value) {
    return
  }
  if (!editFormRef.value?.validate()) {
    toast.add({ title: '필수 항목을 모두 입력해주세요.', color: 'error' })
    return
  }
  saving.value = true
  try {
    await $fetch(`/api/performances/${editingProductId.value}`, {
      method: 'PATCH',
      body: {
        name: editName.value,
        price: editPrice.value,
        categoryId: editCategoryId.value,
        status: editStatus.value,
        serviceId: editServiceId.value,
        exposedServiceIds: editExposedServiceIds.value,
        audienceAge: editAudienceAge.value || undefined,
        genreId: editGenreId.value,
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

// 관리자 화면 삭제는 실제 row를 지우지 않고 deleted=true로만 처리한다(soft delete).
const deletePerformance = async (item: PerformanceListItem) => {
  if (!confirm(`'${item.name}'을(를) 삭제할까요?`)) {
    return
  }
  try {
    await $fetch(`/api/performances/${item.product_id}`, { method: 'DELETE' })
    toast.add({ title: '삭제되었습니다.', color: 'success' })
    await loadItems()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '삭제에 실패했습니다.'
    toast.add({ title: message, color: 'error' })
  }
}

const restorePerformance = async (item: PerformanceListItem) => {
  try {
    await $fetch(`/api/performances/${item.product_id}/restore`, { method: 'POST' })
    toast.add({ title: '복구되었습니다.', color: 'success' })
    await loadItems()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '복구에 실패했습니다.'
    toast.add({ title: message, color: 'error' })
  }
}

const columns = [
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'service_id', header: '소유 서비스' },
  { id: 'exposed', header: '노출 서비스' },
  { accessorKey: 'performance_type', header: '공연구분' },
  { accessorKey: 'status', header: '상태' },
  { accessorKey: 'actions', header: '작업' },
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
      <template #filters>
        <UCheckbox
          v-model="showDeleted"
          label="삭제된 항목 보기"
          aria-label="삭제된 항목 보기"
        />
      </template>

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
          v-if="row.original.deleted"
          label="삭제됨"
          color="error"
          variant="subtle"
        />
        <UBadge
          v-else
          :label="statusLabels[row.original.status as ProductStatus]"
          variant="subtle"
        />
      </template>
      <template #actions-cell="{ row }">
        <AppRowActionsMenu
          :activated="false"
          :deleted="row.original.deleted"
          :show-toggle="false"
          @delete="deletePerformance(row.original)"
          @restore="restorePerformance(row.original)"
        />
      </template>
    </AppDataTable>

    <UButton
      label="신규 등록"
      icon="i-lucide-plus"
      class="self-start"
      @click="startNewPerformance"
    />

    <AppFormDialog
      v-model:open="showCreateForm"
      title="신규 공연작품 등록"
    >
      <div class="flex flex-col gap-4">
        <PerformancesForm
          ref="createFormRef"
          v-model:name="draftName"
          v-model:price="draftPrice"
          v-model:category-id="draftCategoryId"
          v-model:service-id="draftServiceId"
          v-model:exposed-service-ids="draftExposedServiceIds"
          v-model:audience-age="draftAudienceAge"
          v-model:genre-id="draftGenreId"
          v-model:duration-minutes="draftDurationMinutes"
          v-model:description="draftDescription"
          v-model:performance-type="draftPerformanceType"
          v-model:images="draftImages"
          :services="services"
          :categories="categories"
          :genres="genres"
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
    </AppFormDialog>

    <AppFormDialog
      v-model:open="showEditForm"
      title="공연작품 수정"
    >
      <div class="flex flex-col gap-4">
        <UFormField label="상태">
          <USelect
            v-model="editStatus"
            :items="[{ label: '초안', value: 'draft' }, { label: '게시', value: 'published' }, { label: '차단', value: 'blocked' }]"
            aria-label="상태"
          />
        </UFormField>

        <PerformancesForm
          ref="editFormRef"
          v-model:name="editName"
          v-model:price="editPrice"
          v-model:category-id="editCategoryId"
          v-model:service-id="editServiceId"
          v-model:exposed-service-ids="editExposedServiceIds"
          v-model:audience-age="editAudienceAge"
          v-model:genre-id="editGenreId"
          v-model:duration-minutes="editDurationMinutes"
          v-model:description="editDescription"
          v-model:performance-type="editPerformanceType"
          v-model:images="editImages"
          :services="services"
          :categories="categories"
          :genres="genres"
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
    </AppFormDialog>
  </div>
</template>
