<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'default', title: '카테고리/장르 관리' })

type Taxonomy = Database['public']['Tables']['catalog_taxonomies']['Row']
type TaxonomyType = 'category' | 'genre'

const typeLabels: Record<TaxonomyType, string> = { category: '카테고리', genre: '장르' }

const supabase = useSupabaseClient<Database>()
const { isSuperAdmin, loaded } = useAdminAuth()
const toast = useToast()

const activeType = ref<TaxonomyType>('category')
const taxonomies = ref<Taxonomy[]>([])
const loading = ref(false)
const newLabel = ref('')
const creating = ref(false)
// 오작동 삭제 대비 — 켜면 deleted=true인 항목도 같이 불러와서 복구할 수 있게 한다.
const showDeleted = ref(false)

// 카테고리/장르 둘 다 한 테이블(catalog_taxonomies)에 type으로 담겨 있어서,
// 화면에서는 activeType으로 필터링만 하고 실제 로드는 한 번에 전부 해온다(departments.vue와 동일 패턴).
const filteredTaxonomies = computed(() => taxonomies.value.filter(t => t.type === activeType.value))

const loadTaxonomies = async () => {
  loading.value = true
  let query = supabase
    .from('catalog_taxonomies')
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
  taxonomies.value = data ?? []
  loading.value = false
}

onMounted(loadTaxonomies)
watch(showDeleted, loadTaxonomies)

const createTaxonomy = async () => {
  if (!newLabel.value.trim()) {
    return
  }
  creating.value = true
  const { error } = await supabase
    .from('catalog_taxonomies')
    .insert({ type: activeType.value, label: newLabel.value.trim() })
  creating.value = false

  if (error) {
    const isDuplicate = error.code === '23505'
    toast.add({ title: isDuplicate ? '이미 같은 이름이 존재합니다.' : '추가에 실패했습니다.', description: isDuplicate ? undefined : error.message, color: 'error' })
    return
  }
  newLabel.value = ''
  await loadTaxonomies()
}

const toggleActive = async (taxonomy: Taxonomy) => {
  const { error } = await supabase
    .from('catalog_taxonomies')
    .update({ activated: !taxonomy.activated })
    .eq('id', taxonomy.id)

  if (error) {
    toast.add({ title: '변경에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  await loadTaxonomies()
}

// 관리자 화면 삭제는 실제 row를 지우지 않고 deleted=true로만 처리한다(soft delete) —
// 이미 등록된 공연작품이 참조 중인 값일 수 있어서 실제로 지우면 참조 무결성이 깨진다.
const deleteTaxonomy = async (taxonomy: Taxonomy) => {
  if (!confirm(`'${taxonomy.label}'을(를) 삭제할까요? 목록/선택지에서 더 이상 보이지 않습니다.`)) {
    return
  }
  const { error } = await supabase
    .from('catalog_taxonomies')
    .update({ deleted: true })
    .eq('id', taxonomy.id)

  if (error) {
    toast.add({ title: '삭제에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  await loadTaxonomies()
}

const restoreTaxonomy = async (taxonomy: Taxonomy) => {
  const { error } = await supabase
    .from('catalog_taxonomies')
    .update({ deleted: false })
    .eq('id', taxonomy.id)

  if (error) {
    toast.add({ title: '복구에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  toast.add({ title: '복구되었습니다.', color: 'success' })
  await loadTaxonomies()
}

const columns = [
  { accessorKey: 'label', header: '이름' },
  { accessorKey: 'activated', header: '상태' },
  { accessorKey: 'actions', header: '작업' },
]
</script>

<template>
  <div class="p-6 flex flex-col gap-6">
    <UPageCard
      v-if="loaded && !isSuperAdmin"
      title="접근 권한이 없습니다"
      description="카테고리/장르 관리는 Super Admin만 사용할 수 있습니다."
      icon="i-lucide-lock"
    />

    <template v-else>
      <p class="text-sm text-muted">
        공연작품 등록 폼의 카테고리·장르 선택지를 관리합니다. artboda·stub·예술학교가 공통으로 사용합니다.
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
            :placeholder="`${typeLabels[activeType]} 이름`"
            class="flex-1"
            @keyup.enter="createTaxonomy"
          />
          <UButton
            label="추가"
            icon="i-lucide-plus"
            :loading="creating"
            @click="createTaxonomy"
          />
        </div>
      </UPageCard>

      <AppDataTable
        :data="filteredTaxonomies"
        :columns="columns"
        :loading="loading"
        :search-keys="['label']"
        search-placeholder="이름 검색"
      >
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
            @delete="deleteTaxonomy(row.original)"
            @restore="restoreTaxonomy(row.original)"
          />
        </template>
      </AppDataTable>
    </template>
  </div>
</template>
