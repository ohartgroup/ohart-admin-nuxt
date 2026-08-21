<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { isSuperAdmin } = useAdminAuth()
const { hasAnyService } = useRoleAssignments()

const navItems = computed<NavigationMenuItem[][]>(() => {
  const primary: NavigationMenuItem[] = [
    { label: '대시보드', icon: 'i-lucide-layout-dashboard', to: '/' },
  ]

  // super_admin 전용 메뉴를 권한/목적별로 그룹핑한다. 서비스 모듈(아트보다 등)이 생기면
  // 여기에 같은 패턴으로 그룹을 하나 더 추가하되, 그 그룹은 isSuperAdmin이 아니라
  // 해당 서비스의 service_admin 권한(useRoleAssignments)으로 노출 여부를 결정해야 한다.
  if (isSuperAdmin.value) {
    primary.push({
      label: '계정/조직',
      icon: 'i-lucide-users-round',
      type: 'trigger',
      defaultOpen: true,
      children: [
        { label: '가입 승인', icon: 'i-lucide-user-check', to: '/approvals' },
        { label: '관리자 관리', icon: 'i-lucide-users', to: '/admins' },
        { label: '부서 관리', icon: 'i-lucide-building-2', to: '/departments' },
      ],
    })
    primary.push({
      label: '권한/보안',
      icon: 'i-lucide-shield-check',
      type: 'trigger',
      defaultOpen: true,
      children: [
        { label: '서비스 권한 관리', icon: 'i-lucide-key-round', to: '/permissions' },
        { label: '감사 로그', icon: 'i-lucide-scroll-text', to: '/audit-logs' },
      ],
    })
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
