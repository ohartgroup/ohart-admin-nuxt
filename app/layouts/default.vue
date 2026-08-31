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

const supabase = useSupabaseClient()
const signOut = async () => {
  await supabase.auth.signOut()
  navigateTo('/login', { replace: true })
}
</script>
