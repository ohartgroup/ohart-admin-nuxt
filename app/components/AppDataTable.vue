<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

// 검색 + 정렬 + 페이지네이션(현재/전체 페이지, 표시 구간)을 공통 제공하는 테이블 래퍼.
// 필터 UI는 #filters 슬롯으로 받되, 필터링 로직 자체는 호출부가 해서 미리 걸러진 data를 넘기게 한다
// (테이블마다 필터 기준이 달라서 로직까지 여기서 일반화하면 오히려 더 복잡해짐).
const props = withDefaults(defineProps<{
  data: Record<string, unknown>[]
  columns: TableColumn<any>[]
  loading?: boolean
  searchKeys?: string[]
  // 검색 대상이 중첩 객체(예: row.user.email)일 때 쓰는 탈출구. 있으면 searchKeys보다 우선한다.
  searchFn?: (row: Record<string, unknown>, query: string) => boolean
  searchPlaceholder?: string
  pageSize?: number
  empty?: string
}>(), {
  loading: false,
  searchKeys: () => [],
  searchFn: undefined,
  searchPlaceholder: '검색',
  pageSize: 10,
  empty: '데이터가 없습니다.',
})

const UButton = resolveComponent('UButton')

const search = ref('')
const page = ref(1)
const sorting = ref<{ id: string, desc: boolean }[]>([])

// UTable(TanStack)에는 페이지 슬라이스만 넘기기 때문에 정렬은 자체 데이터에서 직접 한다.
// column.toggleSorting()이 sorting을 갱신해주면 그 값을 읽어 filteredData를 정렬만 하고,
// 실제 헤더 아이콘/토글 동작은 TanStack 것을 그대로 쓴다.
const sortableColumns = computed<TableColumn<any>[]>(() =>
  props.columns.map((col) => {
    const accessorKey = 'accessorKey' in col ? col.accessorKey as string : undefined
    if (!accessorKey || typeof col.header !== 'string' || !col.header) {
      return col
    }
    const label = col.header
    return {
      ...col,
      header: ({ column }: any) => {
        const sorted = column.getIsSorted()
        return h(UButton, {
          label,
          color: 'neutral',
          variant: 'ghost',
          size: 'xs',
          icon: sorted === 'asc' ? 'i-lucide-arrow-up' : sorted === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
          class: '-mx-2.5',
          onClick: () => column.toggleSorting(sorted === 'asc'),
        })
      },
    } as TableColumn<any>
  }),
)

const filteredData = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) {
    return props.data
  }
  if (props.searchFn) {
    return props.data.filter(row => props.searchFn!(row, query))
  }
  if (props.searchKeys.length === 0) {
    return props.data
  }
  return props.data.filter(row =>
    props.searchKeys.some((key) => {
      const value = row[key]
      return typeof value === 'string' && value.toLowerCase().includes(query)
    }),
  )
})

const sortedData = computed(() => {
  const sort = sorting.value[0]
  if (!sort) {
    return filteredData.value
  }
  return [...filteredData.value].sort((a, b) => {
    const av = a[sort.id]
    const bv = b[sort.id]
    if (av == null) {
      return 1
    }
    if (bv == null) {
      return -1
    }
    if (av < bv) {
      return sort.desc ? 1 : -1
    }
    if (av > bv) {
      return sort.desc ? -1 : 1
    }
    return 0
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredData.value.length / props.pageSize)))

watch([filteredData, sorting], () => {
  page.value = 1
})

const pagedData = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return sortedData.value.slice(start, start + props.pageSize)
})

const rangeStart = computed(() => (pagedData.value.length === 0 ? 0 : (page.value - 1) * props.pageSize + 1))
const rangeEnd = computed(() => (page.value - 1) * props.pageSize + pagedData.value.length)
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <div class="flex flex-wrap items-center gap-2">
      <UInput
        v-if="searchKeys.length > 0 || searchFn"
        v-model="search"
        icon="i-lucide-search"
        :placeholder="searchPlaceholder"
        aria-label="검색"
        class="w-64"
      />
      <slot name="filters" />
    </div>

    <div class="w-full overflow-x-auto">
      <UTable
        v-model:sorting="sorting"
        :data="pagedData"
        :columns="sortableColumns"
        :loading="loading"
        :empty="empty"
        class="w-full"
      >
        <template
          v-for="slotName in Object.keys($slots).filter(name => name !== 'filters')"
          :key="slotName"
          #[slotName]="slotProps"
        >
          <slot
            :name="slotName"
            v-bind="slotProps"
          />
        </template>
      </UTable>
    </div>

    <div class="flex items-center justify-between text-sm text-muted">
      <span>전체 {{ filteredData.length }}건 중 {{ rangeStart }}–{{ rangeEnd }}건</span>
      <div class="flex items-center gap-3">
        <span>{{ page }} / {{ totalPages }} 페이지</span>
        <UPagination
          v-model:page="page"
          :total="filteredData.length"
          :items-per-page="pageSize"
        />
      </div>
    </div>
  </div>
</template>
