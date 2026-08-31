<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { isSuperAdmin, isDepartmentHead } = useAdminAuth()
const { hasAnyService } = useRoleAssignments()
const { hasAccess: hasArtbodaAccess } = useServiceAccess('artboda')

const navItems = computed<NavigationMenuItem[][]>(() => {
  const primary: NavigationMenuItem[] = [
    { label: '대시보드', icon: 'i-lucide-layout-dashboard', to: '/' },
  ]

  // "계정/조직" 그룹은 항목마다 권한이 달라서 개별적으로 조립한다.
  // 가입 승인/부서 관리는 super_admin 전용, 관리자 관리는 부서장도 접근 가능(자기 부서로 스코프 제한).
  const accountGroupChildren: NavigationMenuItem[] = []
  if (isSuperAdmin.value) {
    accountGroupChildren.push({ label: '가입 승인', icon: 'i-lucide-user-check', to: '/approvals' })
  }
  if (isSuperAdmin.value || isDepartmentHead.value) {
    accountGroupChildren.push({ label: '관리자 관리', icon: 'i-lucide-users', to: '/admins' })
  }
  if (isSuperAdmin.value) {
    accountGroupChildren.push({ label: '부서 관리', icon: 'i-lucide-building-2', to: '/departments' })
  }
  if (accountGroupChildren.length > 0) {
    primary.push({
      label: '계정/조직',
      icon: 'i-lucide-users-round',
      type: 'trigger',
      defaultOpen: true,
      children: accountGroupChildren,
    })
  }

  // 아트보다: super_admin 또는 artboda service_admin에게만 노출(useServiceAccess).
  if (hasArtbodaAccess.value) {
    primary.push({
      label: '아트보다',
      icon: 'i-lucide-drama',
      type: 'trigger',
      defaultOpen: true,
      children: [
        { label: '문의 관리', icon: 'i-lucide-message-square', to: '/artboda/inquiries' },
        { label: '기관 관리', icon: 'i-lucide-building', to: '/artboda/organizations' },
        { label: '계약 관리', icon: 'i-lucide-file-signature', to: '/artboda/contracts' },
        { label: '증빙 발급 관리', icon: 'i-lucide-receipt', to: '/artboda/documents' },
        { label: '약관 관리', icon: 'i-lucide-scroll', to: '/artboda/legal' },
      ],
    })
  }

  if (isSuperAdmin.value) {
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
