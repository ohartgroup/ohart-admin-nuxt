<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { account } = useAdminAuth()
const { hasAnyService } = useRoleAssignments()
</script>

<template>
  <div class="p-6">
    <UPageCard
      v-if="!hasAnyService"
      title="등록된 서비스가 없습니다"
      description="아직 온보딩된 서비스가 없습니다. artboda, artschool 등의 서비스가 온보딩되면 이 화면에 서비스별 대시보드가 표시됩니다."
      icon="i-lucide-inbox"
      class="max-w-lg"
    />

    <div
      v-else
      class="text-sm text-muted"
    >
      {{ account?.department?.name ?? '부서 미설정' }}
    </div>
  </div>
</template>
