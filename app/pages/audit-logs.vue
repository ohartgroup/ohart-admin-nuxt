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

const logs = ref<AuditLog[]>([])
const loading = ref(false)

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
          <span class="text-sm">{{ row.original.targetServiceName ?? '-' }}</span>
        </template>

        <template #targetResource-cell="{ row }">
          <span
            class="text-xs text-muted font-mono truncate block max-w-64"
            :title="resourcePreview(row.original.targetResource)"
          >{{ resourcePreview(row.original.targetResource) }}</span>
        </template>

        <template #ipAddress-cell="{ row }">
          <span class="text-xs text-muted">{{ row.original.ipAddress ?? '-' }}</span>
        </template>
      </AppDataTable>
    </template>
  </div>
</template>
