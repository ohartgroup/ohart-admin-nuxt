<template>
  <UDashboardGroup>
    <UDashboardSidebar
      collapsible
      resizable
      :min-size="12"
      :max-size="20"
      :default-size="15"
    >
      <template #header="{ collapsed }">
        <div
          class="flex items-center w-full px-1"
          :class="collapsed ? 'justify-center' : 'justify-between'"
        >
          <NuxtLink
            v-if="!collapsed"
            to="/"
            class="flex items-center"
          >
            <img
              src="/oart-logo.png"
              alt="OhArt"
              class="w-auto h-5 shrink-0"
            >
          </NuxtLink>
          <UDashboardSidebarCollapse />
        </div>
      </template>

      <AppSidebar />

      <template #footer="{ collapsed }">
        <UColorModeButton v-if="!collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar :title="pageTitle">
          <template #right>
            <UButton
              label="로그아웃"
              icon="i-lucide-log-out"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="signOut"
            />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <main>
          <slot />
        </main>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>

<script setup lang="ts">
const route = useRoute()
const pageTitle = computed(() => (route.meta.title as string | undefined) ?? '대시보드')

// definePageMeta({ title })는 Nuxt 공식 필드가 아니라 <title>에 자동 반영되지 않는다.
// 이미 네비게이션 헤더(pageTitle)에 쓰고 있는 값을 그대로 재사용해서 문서 title도 맞춘다.
useHead({ title: pageTitle })

const supabase = useSupabaseClient()
const signOut = async () => {
  await supabase.auth.signOut()
  navigateTo('/login', { replace: true })
}
</script>
