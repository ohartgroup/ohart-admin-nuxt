<script setup lang="ts">
// 전화번호는 PII라 기본은 마스킹, "보기" 클릭 시에만 RPC로 복호화해서 노출한다.
// 어떤 RPC를 부를지는 화면마다 다르므로(artboda.decrypt_organization_phone 등) props로 받는다.
const props = defineProps<{
  decrypt: () => Promise<string | null>
}>()

const revealed = ref('')
const revealing = ref(false)
const shown = ref(false)

const reveal = async () => {
  if (shown.value) {
    shown.value = false
    return
  }
  revealing.value = true
  revealed.value = await props.decrypt() ?? '조회 실패'
  revealing.value = false
  shown.value = true
}
</script>

<template>
  <div class="flex items-center gap-1">
    <span class="text-sm font-mono">{{ shown ? revealed : '••••-••••-••••' }}</span>
    <UButton
      :icon="shown ? 'i-lucide-eye-off' : 'i-lucide-eye'"
      size="xs"
      variant="ghost"
      color="neutral"
      :loading="revealing"
      @click="reveal"
    />
  </div>
</template>
