<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'default', title: '부서 관리' })

type Department = Database['admin']['Tables']['departments']['Row']

const supabase = useSupabaseClient<Database>()
const { isSuperAdmin, loaded } = useAdminAuth()
const toast = useToast()

const departments = ref<Department[]>([])
const loading = ref(false)
const newName = ref('')
const newCode = ref('')
const newParentId = ref<string | undefined>(undefined)
const creating = ref(false)

// 최상위 그룹만 상위부서로 선택 가능하게 한다(2단계까지만 지원, 3단계 중첩 방지).
const groupOptions = computed(() =>
  departments.value
    .filter(d => !d.parent_id)
    .map(d => ({ label: d.name, value: d.id })),
)

const parentName = (parentId: string | null) => departments.value.find(d => d.id === parentId)?.name ?? '-'

const loadDepartments = async () => {
  loading.value = true
  const { data } = await supabase
    .schema('admin')
    .from('departments')
    .select('*')
    .eq('deleted', false)
    .order('created_at')
  departments.value = data ?? []
  loading.value = false
}

onMounted(loadDepartments)

const createDepartment = async () => {
  if (!newName.value.trim()) {
    return
  }
  creating.value = true
  const { error } = await supabase
    .schema('admin')
    .from('departments')
    .insert({ name: newName.value.trim(), code: newCode.value.trim() || null, parent_id: newParentId.value ?? null })
  creating.value = false

  if (error) {
    toast.add({ title: '부서 추가에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  newName.value = ''
  newCode.value = ''
  newParentId.value = undefined
  await loadDepartments()
}

const toggleActive = async (department: Department) => {
  const { error } = await supabase
    .schema('admin')
    .from('departments')
    .update({ active: !department.active })
    .eq('id', department.id)

  if (error) {
    toast.add({ title: '변경에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  await loadDepartments()
}

const columns = [
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'parent', header: '상위부서' },
  { accessorKey: 'code', header: '코드' },
  { accessorKey: 'active', header: '상태' },
  { accessorKey: 'actions', header: '' },
]
</script>

<template>
  <div class="p-6 max-w-2xl flex flex-col gap-6">
    <UPageCard
      v-if="loaded && !isSuperAdmin"
      title="접근 권한이 없습니다"
      description="부서 관리는 Super Admin만 사용할 수 있습니다."
      icon="i-lucide-lock"
    />

    <template v-else>
      <UPageCard title="부서 추가">
        <div class="flex gap-2">
          <UInput
            v-model="newName"
            aria-label="부서명"
            placeholder="부서명"
            class="flex-1"
          />
          <UInput
            v-model="newCode"
            aria-label="코드"
            placeholder="코드(선택)"
            class="w-32"
          />
          <USelect
            v-model="newParentId"
            :items="groupOptions"
            value-key="value"
            aria-label="상위부서"
            placeholder="상위부서(선택)"
            class="w-40"
          />
          <UButton
            label="추가"
            icon="i-lucide-plus"
            :loading="creating"
            @click="createDepartment"
          />
        </div>
      </UPageCard>

      <UTable
        :data="departments"
        :columns="columns"
        :loading="loading"
      >
        <template #parent-cell="{ row }">
          <span class="text-sm text-muted">{{ parentName(row.original.parent_id) }}</span>
        </template>

        <template #active-cell="{ row }">
          <UBadge
            :label="row.original.active ? '사용' : '미사용'"
            :color="row.original.active ? 'success' : 'neutral'"
            variant="subtle"
          />
        </template>

        <template #actions-cell="{ row }">
          <UButton
            :label="row.original.active ? '비활성화' : '활성화'"
            size="xs"
            variant="soft"
            :color="row.original.active ? 'neutral' : 'primary'"
            @click="toggleActive(row.original)"
          />
        </template>
      </UTable>
    </template>
  </div>
</template>
