<script setup lang="ts">
import type { PerformanceType } from '~/types/performance'

// 등록 폼과 수정 폼이 필드 구성을 그대로 공유한다(performances.vue에서 둘 다 이 컴포넌트를 쓴다).
// productId가 null이면(신규 등록, 저장 전) 이미지는 로컬에 쌓아뒀다가 부모가
// flushPendingUploads(productId)를 호출할 때 업로드된다 — PerformancesImageUploader 참고.
const props = defineProps<{
  services: { id: string, name: string }[]
  productId: string | null
}>()

const name = defineModel<string>('name', { required: true })
const price = defineModel<number>('price', { required: true })
const category = defineModel<string>('category', { required: true })
const serviceId = defineModel<string>('serviceId', { required: true })
const exposedServiceIds = defineModel<string[]>('exposedServiceIds', { required: true })
const audienceAge = defineModel<string>('audienceAge', { required: true })
const genre = defineModel<string>('genre', { required: true })
const durationMinutes = defineModel<number | null>('durationMinutes', { required: true })
const description = defineModel<string>('description', { required: true })
const performanceType = defineModel<PerformanceType | undefined>('performanceType', { required: true })
const images = defineModel<string[]>('images', { required: true })

const imageUploaderRef = useTemplateRef('imageUploaderRef')
defineExpose({
  flushPendingUploads: (productId: string) => imageUploaderRef.value?.flushPendingUploads(productId),
})

const toggleExposedService = (id: string) => {
  const index = exposedServiceIds.value.indexOf(id)
  if (index === -1) {
    exposedServiceIds.value = [...exposedServiceIds.value, id]
  } else {
    exposedServiceIds.value = exposedServiceIds.value.filter(existing => existing !== id)
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-2">
      <UFormField
        label="이름"
        class="flex-1"
      >
        <UInput
          v-model="name"
          aria-label="이름"
          class="w-full"
        />
      </UFormField>
      <UFormField label="가격">
        <UInput
          v-model.number="price"
          type="number"
          aria-label="가격"
        />
      </UFormField>
      <UFormField label="카테고리">
        <UInput
          v-model="category"
          aria-label="카테고리"
        />
      </UFormField>
    </div>

    <UFormField label="소유 서비스 (내부 관리 권한 기준)">
      <USelect
        v-model="serviceId"
        :items="services.map(s => ({ label: s.name, value: s.id }))"
        aria-label="소유 서비스"
      />
    </UFormField>

    <UFormField label="노출 서비스 (복수 선택 가능)">
      <div class="flex gap-3">
        <UCheckbox
          v-for="service in services"
          :key="service.id"
          :model-value="exposedServiceIds.includes(service.id)"
          :label="service.name"
          @update:model-value="toggleExposedService(service.id)"
        />
      </div>
    </UFormField>

    <div class="flex gap-2">
      <UFormField
        label="관객 연령대"
        class="flex-1"
      >
        <UInput
          v-model="audienceAge"
          aria-label="관객 연령대"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="장르"
        class="flex-1"
      >
        <UInput
          v-model="genre"
          aria-label="장르"
          class="w-full"
        />
      </UFormField>
      <UFormField label="러닝타임(분)">
        <UInput
          v-model.number="durationMinutes"
          type="number"
          aria-label="러닝타임"
        />
      </UFormField>
      <UFormField label="공연구분">
        <USelect
          v-model="performanceType"
          :items="[{ label: '직접제작', value: 'direct' }, { label: '중개', value: 'brokered' }]"
          aria-label="공연구분"
        />
      </UFormField>
    </div>

    <UFormField label="설명">
      <UTextarea
        v-model="description"
        class="w-full"
      />
    </UFormField>

    <UFormField label="이미지">
      <PerformancesImageUploader
        ref="imageUploaderRef"
        v-model="images"
        :product-id="props.productId"
      />
    </UFormField>
  </div>
</template>
