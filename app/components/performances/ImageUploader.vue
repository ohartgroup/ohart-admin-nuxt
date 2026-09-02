<script setup lang="ts">
// 공연작품 이미지 업로더 — issue #59.
// productId가 없으면(신규 등록 폼, 아직 저장 전) 파일을 File 객체로만 들고 있다가
// 부모가 flushPendingUploads(productId)를 호출할 때 한 번에 업로드한다 — 상품이 아직
// 없어서 Storage 경로({productId}/...)를 만들 수 없기 때문. productId가 있으면(수정 중,
// 또는 등록 직후) 파일을 고르는 즉시 업로드한다. 두 상태가 동시에 존재하지는 않는다
// (등록 폼은 저장 전엔 productId가 없고, 저장하는 순간 flush로 pending을 비운다).
const props = defineProps<{
  productId: string | null
}>()

const images = defineModel<string[]>({ required: true })

const toast = useToast()

const pendingFiles = ref<File[]>([])
const pendingPreviewUrls = ref<string[]>([])
const uploading = ref(false)
const pickedFiles = ref<File[] | null>(null)

interface DisplayItem {
  key: string
  url: string
  pending: boolean
}

const displayItems = computed<DisplayItem[]>(() => {
  if (props.productId) {
    return images.value.map(url => ({ key: url, url, pending: false }))
  }
  return pendingFiles.value.map((file, index) => ({
    key: `${file.name}-${file.lastModified}-${index}`,
    url: pendingPreviewUrls.value[index]!,
    pending: true,
  }))
})

const uploadFiles = async (productId: string, files: File[]) => {
  const formData = new FormData()
  for (const file of files) {
    formData.append('files', file)
  }
  const result = await $fetch<{ images: string[] }>(`/api/performances/${productId}/images`, {
    method: 'POST',
    body: formData,
  })
  return result.images
}

const onFilesChange = async () => {
  const newFiles = pickedFiles.value ?? []
  pickedFiles.value = null
  if (newFiles.length === 0) return

  if (!props.productId) {
    pendingFiles.value = [...pendingFiles.value, ...newFiles]
    pendingPreviewUrls.value = [...pendingPreviewUrls.value, ...newFiles.map(file => URL.createObjectURL(file))]
    return
  }

  uploading.value = true
  try {
    images.value = await uploadFiles(props.productId, newFiles)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.'
    toast.add({ title: message, color: 'error' })
  } finally {
    uploading.value = false
  }
}

// 등록 폼이 최초 저장으로 productId를 막 발급받은 시점에 호출 — 그때까지 쌓아둔
// pendingFiles를 한 번에 업로드하고 비운다.
const flushPendingUploads = async (productId: string) => {
  if (pendingFiles.value.length === 0) return
  uploading.value = true
  try {
    images.value = await uploadFiles(productId, pendingFiles.value)
    pendingPreviewUrls.value.forEach(url => URL.revokeObjectURL(url))
    pendingFiles.value = []
    pendingPreviewUrls.value = []
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.'
    toast.add({ title: message, color: 'error' })
  } finally {
    uploading.value = false
  }
}

defineExpose({ flushPendingUploads, hasPending: computed(() => pendingFiles.value.length > 0) })

const move = (index: number, direction: -1 | 1) => {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= displayItems.value.length) return

  if (props.productId) {
    const next = [...images.value]
    ;[next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!]
    images.value = next
    $fetch(`/api/performances/${props.productId}/images`, { method: 'PATCH', body: { images: next } }).catch(() => {
      toast.add({ title: '순서 변경 저장에 실패했습니다.', color: 'error' })
    })
    return
  }

  const nextFiles = [...pendingFiles.value]
  const nextUrls = [...pendingPreviewUrls.value]
  ;[nextFiles[index], nextFiles[targetIndex]] = [nextFiles[targetIndex]!, nextFiles[index]!]
  ;[nextUrls[index], nextUrls[targetIndex]] = [nextUrls[targetIndex]!, nextUrls[index]!]
  pendingFiles.value = nextFiles
  pendingPreviewUrls.value = nextUrls
}

const removeAt = async (index: number) => {
  if (props.productId) {
    const url = images.value[index]!
    const next = images.value.filter((_, i) => i !== index)
    images.value = next
    try {
      await $fetch(`/api/performances/${props.productId}/images`, { method: 'DELETE', body: { url } })
    } catch {
      toast.add({ title: '이미지 삭제에 실패했습니다.', color: 'error' })
    }
    return
  }

  URL.revokeObjectURL(pendingPreviewUrls.value[index]!)
  pendingFiles.value = pendingFiles.value.filter((_, i) => i !== index)
  pendingPreviewUrls.value = pendingPreviewUrls.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <UFileUpload
      v-model="pickedFiles"
      multiple
      accept="image/*"
      :preview="false"
      icon="i-lucide-image-plus"
      label="이미지를 드래그하거나 클릭해서 추가"
      description="복수 선택 가능 · 첫 번째 이미지가 대표 이미지로 노출됩니다"
      :loading="uploading"
      class="w-full"
      @change="onFilesChange"
    />

    <div
      v-if="displayItems.length"
      class="flex gap-3 overflow-x-auto pb-2"
    >
      <div
        v-for="(item, index) in displayItems"
        :key="item.key"
        class="relative flex-none w-32"
      >
        <div class="relative aspect-square overflow-hidden rounded-lg border border-default">
          <img
            :src="item.url"
            :alt="`이미지 ${index + 1}`"
            class="h-full w-full object-cover"
          >
          <UBadge
            v-if="index === 0"
            label="대표"
            color="primary"
            size="sm"
            class="absolute top-1 left-1"
          />
          <UBadge
            v-if="item.pending"
            label="업로드 대기"
            color="neutral"
            variant="subtle"
            size="sm"
            class="absolute top-1 right-1"
          />
        </div>
        <div class="flex justify-between items-center mt-1">
          <div class="flex gap-0.5">
            <UButton
              icon="i-lucide-chevron-left"
              size="xs"
              variant="ghost"
              color="neutral"
              :disabled="index === 0"
              aria-label="앞으로 이동"
              @click="move(index, -1)"
            />
            <UButton
              icon="i-lucide-chevron-right"
              size="xs"
              variant="ghost"
              color="neutral"
              :disabled="index === displayItems.length - 1"
              aria-label="뒤로 이동"
              @click="move(index, 1)"
            />
          </div>
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            variant="ghost"
            color="error"
            aria-label="이미지 삭제"
            @click="removeAt(index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
