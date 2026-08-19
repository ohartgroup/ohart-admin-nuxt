<script setup lang="ts">
// role_assignments에 service_id가 생기면(artboda/artschool 온보딩 시) 여기에 서비스 전환 UI를 채운다.
// 현재는 온보딩된 서비스가 없어 AppSidebar에서 렌더되지 않는다.
const { serviceIds } = useRoleAssignments()
</script>

<template>
  <USelect
    :items="serviceIds"
    placeholder="서비스 선택"
    class="w-full"
  />
</template>
