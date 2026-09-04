<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'default', title: '아트보다 · 문의 선택값 관리' })

type InquiryOption = Database['artboda']['Tables']['inquiry_options']['Row']
type OptionType = 'inquiry_type' | 'org_category' | 'budget_range'

const typeLabels: Record<OptionType, string> = { inquiry_type: '문의 유형', org_category: '기관 유형', budget_range: '예산 범위' }

// 타입별 코드 채번 prefix — catalog_taxonomies(THC/GRC/PTC)와 동일한 규칙(0039).
const codePrefixes: Record<OptionType, string> = { inquiry_type: 'ITC', org_category: 'OGC', budget_range: 'BRC' }

const supabase = useSupabaseClient<Database>()
const toast = useToast()

const activeType = ref<OptionType>('inquiry_type')
const options = ref<InquiryOption[]>([])
const loading = ref(false)
const newLabel = ref('')
const newSlug = ref('')
const creating = ref(false)
// 오작동 삭제 대비 — 켜면 deleted=true인 항목도 같이 불러와서 복구할 수 있게 한다.
const showDeleted = ref(false)

// 세 타입 다 한 테이블(artboda.inquiry_options)에 type으로 담겨 있어서,
// 화면에서는 activeType으로 필터링만 하고 실제 로드는 한 번에 전부 해온다(catalog-taxonomies.vue와 동일 패턴).
const filteredOptions = computed(() => options.value.filter(o => o.type === activeType.value))

const loadOptions = async () => {
  loading.value = true
  let query = supabase
    .schema('artboda')
    .from('inquiry_options')
    .select('*')
    .order('type')
    .order('sort_order')
    .order('label')

  if (!showDeleted.value) {
    query = query.eq('deleted', false)
  }

  const { data, error } = await query

  if (error) {
    toast.add({ title: '목록을 불러오지 못했습니다.', description: error.message, color: 'error' })
  }
  options.value = data ?? []
  loading.value = false
}

onMounted(loadOptions)
watch(showDeleted, loadOptions)

// unique(type, code)/unique(type, slug) 둘 다 deleted 여부와 무관하게 걸려있어서(0039) 삭제된
// 코드는 재사용이 불가능하다 — 채번도 deleted 필터 없이 전체 row 기준으로 봐야 충돌하지 않는다.
const nextCode = async (type: OptionType) => {
  const prefix = codePrefixes[type]
  const { data } = await supabase
    .schema('artboda')
    .from('inquiry_options')
    .select('code')
    .eq('type', type)
    .order('code', { ascending: false })
    .limit(1)
    .maybeSingle()
  const lastNumber = data?.code ? Number.parseInt(data.code.slice(prefix.length), 10) : 0
  return `${prefix}${String(lastNumber + 1).padStart(3, '0')}`
}

const createOption = async () => {
  if (!newLabel.value.trim() || !newSlug.value.trim()) {
    return
  }
  creating.value = true
  const code = await nextCode(activeType.value)
  const { error } = await supabase
    .schema('artboda')
    .from('inquiry_options')
    .insert({ type: activeType.value, code, slug: newSlug.value.trim(), label: newLabel.value.trim() })
  creating.value = false

  if (error) {
    const isDuplicate = error.code === '23505'
    toast.add({ title: isDuplicate ? '이미 같은 이름 또는 slug가 존재합니다.' : '추가에 실패했습니다.', description: isDuplicate ? undefined : error.message, color: 'error' })
    return
  }
  newLabel.value = ''
  newSlug.value = ''
  await loadOptions()
}

const toggleActive = async (option: InquiryOption) => {
  const { error } = await supabase
    .schema('artboda')
    .from('inquiry_options')
    .update({ activated: !option.activated })
    .eq('id', option.id)

  if (error) {
    toast.add({ title: '변경에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  await loadOptions()
}

// 관리자 화면 삭제는 실제 row를 지우지 않고 deleted=true로만 처리한다(soft delete) —
// 이미 접수된 문의가 참조 중인 값일 수 있어서 실제로 지우면 참조 무결성이 깨진다.
const deleteOption = async (option: InquiryOption) => {
  if (!confirm(`'${option.label}'을(를) 삭제할까요? 문의 폼 선택지에서 더 이상 보이지 않습니다.`)) {
    return
  }
  const { error } = await supabase
    .schema('artboda')
    .from('inquiry_options')
    .update({ deleted: true })
    .eq('id', option.id)

  if (error) {
    toast.add({ title: '삭제에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  await loadOptions()
}

const restoreOption = async (option: InquiryOption) => {
  const { error } = await supabase
    .schema('artboda')
    .from('inquiry_options')
    .update({ deleted: false })
    .eq('id', option.id)

  if (error) {
    toast.add({ title: '복구에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  toast.add({ title: '복구되었습니다.', color: 'success' })
  await loadOptions()
}

const columns = [
  { accessorKey: 'code', header: '코드' },
  { accessorKey: 'slug', header: 'slug' },
  { accessorKey: 'label', header: '이름' },
  { accessorKey: 'activated', header: '상태' },
  { accessorKey: 'actions', header: '작업' },
]
</script>

<template>
  <div class="p-6 flex flex-col gap-6">
    <p class="text-sm text-muted">
      아트보다 문의하기 폼의 문의 유형·기관 유형·예산 범위 선택지를 관리합니다. 프론트·서버 로직은 slug(안정 키)를 참조하므로, 등록 후에는 slug를 바꾸지 마세요 — 이름(label)만 자유롭게 수정하면 됩니다.
    </p>

    <div class="flex items-center justify-between">
      <div class="flex gap-2">
        <UButton
          v-for="(label, type) in typeLabels"
          :key="type"
          :label="label"
          :variant="activeType === type ? 'solid' : 'soft'"
          @click="activeType = type"
        />
      </div>
      <UCheckbox
        v-model="showDeleted"
        label="삭제된 항목 보기"
        aria-label="삭제된 항목 보기"
      />
    </div>

    <UPageCard
      :title="`${typeLabels[activeType]} 추가`"
      class="max-w-2xl"
    >
      <div class="flex gap-2">
        <UInput
          v-model="newLabel"
          :aria-label="`${typeLabels[activeType]} 이름`"
          :placeholder="`${typeLabels[activeType]} 이름 (예: 공연 예약)`"
          class="flex-1"
        />
        <UInput
          v-model="newSlug"
          aria-label="slug"
          placeholder="slug (예: show_booking)"
          class="flex-1"
          @keyup.enter="createOption"
        />
        <UButton
          label="추가"
          icon="i-lucide-plus"
          :loading="creating"
          @click="createOption"
        />
      </div>
    </UPageCard>

    <AppDataTable
      :data="filteredOptions"
      :columns="columns"
      :loading="loading"
      :search-keys="['label', 'slug']"
      search-placeholder="이름/slug 검색"
    >
      <template #code-cell="{ row }">
        <span class="text-sm text-muted font-mono">{{ row.original.code }}</span>
      </template>

      <template #slug-cell="{ row }">
        <span class="text-sm text-muted font-mono">{{ row.original.slug }}</span>
      </template>

      <template #activated-cell="{ row }">
        <UBadge
          v-if="row.original.deleted"
          label="삭제됨"
          color="error"
          variant="subtle"
        />
        <UBadge
          v-else
          :label="row.original.activated ? '사용' : '미사용'"
          :color="row.original.activated ? 'success' : 'neutral'"
          variant="subtle"
        />
      </template>

      <template #actions-cell="{ row }">
        <AppRowActionsMenu
          :activated="row.original.activated"
          :deleted="row.original.deleted"
          @toggle="toggleActive(row.original)"
          @delete="deleteOption(row.original)"
          @restore="restoreOption(row.original)"
        />
      </template>
    </AppDataTable>
  </div>
</template>
