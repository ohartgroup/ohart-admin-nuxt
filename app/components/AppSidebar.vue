<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { isSuperAdmin } = useAdminAuth()
const { hasAnyService } = useRoleAssignments()

const navItems = computed<NavigationMenuItem[][]>(() => {
  const primary: NavigationMenuItem[] = [
    { label: '대시보드', icon: 'i-lucide-layout-dashboard', to: '/' },
  ]

  if (isSuperAdmin.value) {
    primary.push({ label: '가입 승인', icon: 'i-lucide-user-check', to: '/approvals' })
    primary.push({ label: '부서 관리', icon: 'i-lucide-building-2', to: '/departments' })
  }

  const secondary: NavigationMenuItem[] = [
    { label: '내 정보', icon: 'i-lucide-user-round', to: '/profile' },
  ]

  return [primary, secondary]
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <ServiceSwitcher v-if="hasAnyService" />

    <UNavigationMenu
      orientation="vertical"
      :items="navItems"
    />
  </div>
</template>
