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
    primary.push({ label: '관리자 관리', icon: 'i-lucide-users', to: '/admins' })
    primary.push({ label: '서비스 권한 관리', icon: 'i-lucide-shield-check', to: '/permissions' })
    primary.push({ label: '부서 관리', icon: 'i-lucide-building-2', to: '/departments' })
    primary.push({ label: '감사 로그', icon: 'i-lucide-scroll-text', to: '/audit-logs' })
  }

  const secondary: NavigationMenuItem[] = [
    { label: '내 정보', icon: 'i-lucide-user-round', to: '/profile' },
  ]

  return [primary, secondary]
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <LazyServiceSwitcher v-if="hasAnyService" />

    <!-- UNavigationMenu(reka-ui NavigationMenuRoot)가 이미 <nav>로 렌더링되므로
         여기서 또 <nav>로 감싸면 중첩 landmark가 되어 접근성 검증기가 걸린다. -->
    <UNavigationMenu
      orientation="vertical"
      aria-label="주 메뉴"
      :items="navItems"
    />
  </div>
</template>
