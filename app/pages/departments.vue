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
// 오작동 삭제 대비 — 켜면 deleted=true인 부서도 같이 불러와서 복구할 수 있게 한다.
const showDeleted = ref(false)

// 최상위 그룹만 상위부서로 선택 가능하게 한다(2단계까지만 지원, 3단계 중첩 방지).
// 삭제된 그룹은 showDeleted 토글과 무관하게 항상 선택지에서 제외한다.
const groupOptions = computed(() =>
  departments.value
    .filter(d => !d.parent_id && !d.deleted)
    .map(d => ({ label: d.name, value: d.id })),
)

const parentName = (parentId: string | null) => departments.value.find(d => d.id === parentId)?.name ?? '-'

const filterGroupId = ref<string | undefined>(undefined)
const filteredDepartments = computed(() => {
  if (!filterGroupId.value) {
    return departments.value
  }
  return departments.value.filter(d => d.id === filterGroupId.value || d.parent_id === filterGroupId.value)
})

const loadDepartments = async () => {
  loading.value = true
  let query = supabase
    .schema('admin')
    .from('departments')
    .select('*')
    .order('created_at')

  if (!showDeleted.value) {
    query = query.eq('deleted', false)
  }

  const { data } = await query
  departments.value = data ?? []
  loading.value = false
}

onMounted(loadDepartments)
watch(showDeleted, loadDepartments)

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

// 관리자 화면 삭제는 실제 row를 지우지 않고 deleted=true로만 처리한다(soft delete) —
// 이미 배정된 관리자(admin_accounts.department_id)나 하위 부서(parent_id)가 이 부서를
// 참조 중일 수 있어서 실제로 지우면 참조 무결성이 깨진다.
const deleteDepartment = async (department: Department) => {
  if (!confirm(`'${department.name}'을(를) 삭제할까요? 배정된 관리자나 하위 부서가 있다면 그대로 남아있을 수 있습니다.`)) {
    return
  }
  const { error } = await supabase
    .schema('admin')
    .from('departments')
    .update({ deleted: true })
    .eq('id', department.id)

  if (error) {
    toast.add({ title: '삭제에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  await loadDepartments()
}

const restoreDepartment = async (department: Department) => {
  const { error } = await supabase
    .schema('admin')
    .from('departments')
    .update({ deleted: false })
    .eq('id', department.id)

  if (error) {
    toast.add({ title: '복구에 실패했습니다.', description: error.message, color: 'error' })
    return
  }
  toast.add({ title: '복구되었습니다.', color: 'success' })
  await loadDepartments()
}

const columns = [
  { accessorKey: 'name', header: '이름' },
  { accessorKey: 'parent', header: '상위부서' },
  { accessorKey: 'code', header: '코드' },
  { accessorKey: 'active', header: '상태' },
  { accessorKey: 'actions', header: '작업' },
]
</script>

<template>
  <div class="p-6 flex flex-col gap-6">
    <UPageCard
      v-if="loaded && !isSuperAdmin"
      title="접근 권한이 없습니다"
      description="부서 관리는 Super Admin만 사용할 수 있습니다."
      icon="i-lucide-lock"
    />

    <template v-else>
      <UPageCard
        title="부서 추가"
        class="max-w-2xl"
      >
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

      <AppDataTable
        :data="filteredDepartments"
        :columns="columns"
        :loading="loading"
        :search-keys="['name', 'code']"
        search-placeholder="부서명/코드 검색"
      >
        <template #filters>
          <USelect
            v-model="filterGroupId"
            :items="groupOptions"
            value-key="value"
            aria-label="그룹 필터"
            placeholder="그룹으로 필터"
            class="w-40"
          />
          <UButton
            v-if="filterGroupId"
            label="필터 해제"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="filterGroupId = undefined"
          />
          <UCheckbox
            v-model="showDeleted"
            label="삭제된 부서 보기"
          />
        </template>

        <template #parent-cell="{ row }">
          <span class="text-sm text-muted">{{ parentName(row.original.parent_id) }}</span>
        </template>

        <template #active-cell="{ row }">
          <UBadge
            v-if="row.original.deleted"
            label="삭제됨"
            color="error"
            variant="subtle"
          />
          <UBadge
            v-else
            :label="row.original.active ? '사용' : '미사용'"
            :color="row.original.active ? 'success' : 'neutral'"
            variant="subtle"
          />
        </template>

        <template #actions-cell="{ row }">
          <AppRowActionsMenu
            :activated="row.original.active"
            :deleted="row.original.deleted"
            @toggle="toggleActive(row.original)"
            @delete="deleteDepartment(row.original)"
            @restore="restoreDepartment(row.original)"
          />
        </template>
      </AppDataTable>
    </template>
  </div>
</template>
