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
        <NuxtLink
          to="/"
          class="flex items-center px-1"
        >
          <img
            v-if="!collapsed"
            src="/oart-logo.png"
            alt="OhArt"
            class="w-auto h-5 shrink-0"
          >
          <UIcon
            v-else
            name="i-lucide-circle"
            class="size-5 text-primary"
          />
        </NuxtLink>
      </template>

      <AppSidebar />

      <template #footer="{ collapsed }">
        <UDashboardSidebarCollapse />
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
        <slot />
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
