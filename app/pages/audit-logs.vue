<script setup lang="ts">
definePageMeta({ layout: 'default', title: '감사 로그' })

interface AuditLog {
  id: string
  actorEmail: string | null
  actorDisplayName: string | null
  action: string
  targetServiceName: string | null
  targetResource: Record<string, unknown> | null
  ipAddress: string | null
  occurredAt: string
}

const { isSuperAdmin, loaded } = useAdminAuth()
const toast = useToast()

const logs = ref<AuditLog[]>([])
const loading = ref(false)
const showResourceModal = ref(false)
const selectedResource = ref<Record<string, unknown> | null>(null)
const selectedAction = ref('')

const openResource = (log: AuditLog) => {
  selectedResource.value = log.targetResource
  selectedAction.value = log.action
  showResourceModal.value = true
}

const selectedResourceJson = computed(() => selectedResource.value ? JSON.stringify(selectedResource.value, null, 2) : '')

const copyResource = async () => {
  await navigator.clipboard.writeText(selectedResourceJson.value)
  toast.add({ title: '복사되었습니다.', color: 'success' })
}

const loadLogs = async () => {
  loading.value = true
  logs.value = await $fetch<AuditLog[]>('/api/admin/audit-logs')
  loading.value = false
}

onMounted(loadLogs)

const searchLog = (row: Record<string, unknown>, query: string) => {
  const log = row as unknown as AuditLog
  return log.action.toLowerCase().includes(query)
    || (log.actorEmail?.toLowerCase().includes(query) ?? false)
    || (log.actorDisplayName?.toLowerCase().includes(query) ?? false)
}

const formatDate = (iso: string) => new Date(iso).toLocaleString('ko-KR')

const resourcePreview = (resource: Record<string, unknown> | null) => resource ? JSON.stringify(resource) : '-'

const columns = [
  { accessorKey: 'occurredAt', header: '시각' },
  { accessorKey: 'actorEmail', header: '관리자' },
  { accessorKey: 'action', header: '액션' },
  { accessorKey: 'targetServiceName', header: '대상 서비스' },
  { accessorKey: 'targetResource', header: '대상 리소스' },
  { accessorKey: 'ipAddress', header: 'IP' },
]
</script>

<template>
  <div class="p-6">
    <UPageCard
      v-if="loaded && !isSuperAdmin"
      title="접근 권한이 없습니다"
      description="감사 로그는 Super Admin만 사용할 수 있습니다."
      icon="i-lucide-lock"
    />

    <template v-else>
      <p class="text-xs text-muted mb-3">
        최근 300건만 표시됩니다.
      </p>

      <AppDataTable
        :data="logs"
        :columns="columns"
        :loading="loading"
        :search-fn="searchLog"
        search-placeholder="관리자/액션 검색"
      >
        <template #occurredAt-cell="{ row }">
          <span class="text-sm whitespace-nowrap">{{ formatDate(row.original.occurredAt) }}</span>
        </template>

        <template #actorEmail-cell="{ row }">
          <div class="flex flex-col">
            <span class="font-medium text-sm">{{ row.original.actorEmail ?? '-' }}</span>
            <span class="text-xs text-muted">{{ row.original.actorDisplayName }}</span>
          </div>
        </template>

        <template #action-cell="{ row }">
          <UBadge
            :label="row.original.action"
            variant="subtle"
            color="neutral"
          />
        </template>

        <template #targetServiceName-cell="{ row }">
          <span class="text-sm">{{ row.original.targetServiceName ?? '통합관리자' }}</span>
        </template>

        <template #targetResource-cell="{ row }">
          <button
            v-if="row.original.targetResource"
            type="button"
            class="text-xs text-muted font-mono truncate block max-w-64 text-left hover:underline cursor-pointer"
            :title="resourcePreview(row.original.targetResource)"
            @click="openResource(row.original)"
          >
            {{ resourcePreview(row.original.targetResource) }}
          </button>
          <span
            v-else
            class="text-xs text-muted"
          >-</span>
        </template>

        <template #ipAddress-cell="{ row }">
          <span class="text-xs text-muted">{{ row.original.ipAddress ?? '-' }}</span>
        </template>
      </AppDataTable>
    </template>

    <UModal
      v-model:open="showResourceModal"
      :title="selectedAction"
      description="대상 리소스"
    >
      <template #body>
        <div class="relative">
          <UButton
            icon="i-lucide-copy"
            size="xs"
            variant="outline"
            color="neutral"
            aria-label="복사"
            class="absolute top-2 right-2"
            @click="copyResource"
          />
          <pre class="text-xs font-mono bg-elevated rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all">{{ selectedResourceJson }}</pre>
        </div>
      </template>
    </UModal>
  </div>
</template>
