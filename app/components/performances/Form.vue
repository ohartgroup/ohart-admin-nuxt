<script setup lang="ts">
import type { AudienceAgeRange, PerformanceType } from '~/types/performance'

// 등록 폼과 수정 폼이 필드 구성을 그대로 공유한다(performances.vue에서 둘 다 이 컴포넌트를 쓴다).
// productId가 null이면(신규 등록, 저장 전) 이미지는 로컬에 쌓아뒀다가 부모가
// flushPendingUploads(productId)를 호출할 때 업로드된다 — PerformancesImageUploader 참고.
const props = defineProps<{
  services: { id: string, name: string }[]
  categories: { id: string, label: string }[]
  genres: { id: string, label: string }[]
  productId: string | null
}>()

const name = defineModel<string>('name', { required: true })
const price = defineModel<number>('price', { required: true })
const categoryId = defineModel<string | undefined>('categoryId', { required: true })
const serviceId = defineModel<string>('serviceId', { required: true })
const exposedServiceIds = defineModel<string[]>('exposedServiceIds', { required: true })
const audienceAge = defineModel<AudienceAgeRange | undefined>('audienceAge', { required: true })
const genreId = defineModel<string | undefined>('genreId', { required: true })
const durationMinutes = defineModel<number | null>('durationMinutes', { required: true })
const description = defineModel<string>('description', { required: true })
const performanceType = defineModel<PerformanceType | undefined>('performanceType', { required: true })
const images = defineModel<string[]>('images', { required: true })

// 연령대는 자유입력을 받으면 "20대", "20", "이십대" 등 표기가 제각각이라 필터/통계에 못 쓴다 —
// 10년 단위 고정 선택지로 제한한다. DB엔 영문 코드(audience_age_range ENUM)로 저장하고
// 화면 라벨은 여기서만 한글로 보여준다(performance_type과 동일 패턴).
const audienceAgeOptions: { label: string, value: AudienceAgeRange }[] = [
  { label: '전체', value: 'all' },
  { label: '10대', value: '10s' },
  { label: '20대', value: '20s' },
  { label: '30대', value: '30s' },
  { label: '40대', value: '40s' },
  { label: '50대', value: '50s' },
  { label: '60대', value: '60s' },
  { label: '70대 이상', value: '70s_plus' },
]

const imageUploaderRef = useTemplateRef('imageUploaderRef')

const errors = ref<Record<string, string>>({})

// 지금 폼에 있는 정보는 전부 필수값으로 취급한다(사용자 요청) — 서버에서도 걸러주긴 하지만
// 여기서 먼저 막아야 어디가 비었는지 필드별로 바로 알려줄 수 있다.
const validate = () => {
  const next: Record<string, string> = {}
  if (!name.value?.trim()) next.name = '필수 항목입니다.'
  if (price.value === null || price.value === undefined || Number.isNaN(price.value)) next.price = '필수 항목입니다.'
  if (!serviceId.value) next.serviceId = '필수 항목입니다.'
  if (exposedServiceIds.value.length === 0) next.exposedServiceIds = '하나 이상 선택해주세요.'
  if (!categoryId.value) next.categoryId = '필수 항목입니다.'
  if (!genreId.value) next.genreId = '필수 항목입니다.'
  if (!audienceAge.value) next.audienceAge = '필수 항목입니다.'
  if (durationMinutes.value === null || durationMinutes.value === undefined) {
    next.durationMinutes = '필수 항목입니다.'
  } else if (durationMinutes.value % 5 !== 0) {
    next.durationMinutes = '5분 단위로 입력해주세요.'
  }
  if (!performanceType.value) next.performanceType = '필수 항목입니다.'
  // 등록 폼(productId 없음)은 아직 업로드되지 않고 로컬에만 쌓인 파일이 있을 수 있어서
  // images.value(이미 업로드된 URL)만 보면 안 되고 ImageUploader의 대기열도 같이 봐야 한다.
  if (images.value.length === 0 && !imageUploaderRef.value?.hasPending) {
    next.images = '하나 이상 등록해주세요.'
  }
  if (!description.value?.trim()) next.description = '필수 항목입니다.'

  errors.value = next
  return Object.keys(next).length === 0
}

defineExpose({
  flushPendingUploads: (productId: string) => imageUploaderRef.value?.flushPendingUploads(productId),
  validate,
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
    <!-- 1행: 소유/노출 서비스 — 어떤 서비스에 속하고 어디에 노출되는지가 다른 값들의 전제가
         되는 정보라 폼 맨 위로 뺐다. -->
    <div class="flex gap-4">
      <UFormField
        label="소유 서비스 (내부 관리 권한 기준)"
        class="flex-1"
        required
        :error="errors.serviceId"
      >
        <USelect
          v-model="serviceId"
          :items="services.map(s => ({ label: s.name, value: s.id }))"
          aria-label="소유 서비스"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="노출 서비스 (복수 선택 가능)"
        class="flex-1"
        required
        :error="errors.exposedServiceIds"
      >
        <div class="flex gap-3 h-8 items-center">
          <UCheckbox
            v-for="service in services"
            :key="service.id"
            :model-value="exposedServiceIds.includes(service.id)"
            :label="service.name"
            :aria-label="service.name"
            @update:model-value="toggleExposedService(service.id)"
          />
        </div>
      </UFormField>
    </div>

    <!-- 2행: 이름 -->
    <UFormField
      label="이름"
      required
      :error="errors.name"
    >
      <UInput
        v-model="name"
        aria-label="이름"
        class="w-full"
      />
    </UFormField>

    <!-- 3행: 가격/카테고리/장르 -->
    <div class="flex gap-2">
      <UFormField
        label="가격"
        required
        :error="errors.price"
      >
        <UInput
          v-model.number="price"
          type="number"
          aria-label="가격"
        />
      </UFormField>
      <UFormField
        label="카테고리"
        class="flex-1"
        required
        :error="errors.categoryId"
      >
        <USelect
          v-model="categoryId"
          :items="categories.map(c => ({ label: c.label, value: c.id }))"
          placeholder="카테고리 선택"
          aria-label="카테고리"
          class="w-full"
        >
          <template
            v-if="categories.length === 0"
            #content-top
          >
            <p class="px-2 py-1.5 text-xs text-muted">
              등록된 카테고리가 없습니다
            </p>
          </template>
        </USelect>
      </UFormField>
      <UFormField
        label="장르"
        class="flex-1"
        required
        :error="errors.genreId"
      >
        <USelect
          v-model="genreId"
          :items="genres.map(g => ({ label: g.label, value: g.id }))"
          placeholder="장르 선택"
          aria-label="장르"
          class="w-full"
        >
          <template
            v-if="genres.length === 0"
            #content-top
          >
            <p class="px-2 py-1.5 text-xs text-muted">
              등록된 장르가 없습니다
            </p>
          </template>
        </USelect>
      </UFormField>
    </div>

    <!-- 4행: 관객 연령대/러닝타임/공연구분 -->
    <div class="flex gap-2">
      <UFormField
        label="관객 연령대"
        class="flex-1"
        required
        :error="errors.audienceAge"
      >
        <USelect
          v-model="audienceAge"
          :items="audienceAgeOptions"
          placeholder="연령대 선택"
          aria-label="관객 연령대"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="러닝타임(분)"
        required
        :error="errors.durationMinutes"
      >
        <UInput
          v-model.number="durationMinutes"
          type="number"
          step="5"
          min="0"
          aria-label="러닝타임"
        />
      </UFormField>
      <UFormField
        label="공연구분"
        class="w-36"
        required
        :error="errors.performanceType"
      >
        <USelect
          v-model="performanceType"
          :items="[{ label: '직접제작', value: 'direct' }, { label: '중개', value: 'brokered' }]"
          aria-label="공연구분"
          class="w-full"
        />
      </UFormField>
    </div>

    <!-- 5행: 이미지 -->
    <UFormField
      label="이미지"
      required
      :error="errors.images"
    >
      <PerformancesImageUploader
        ref="imageUploaderRef"
        v-model="images"
        :product-id="props.productId"
      />
    </UFormField>

    <!-- 6행: 상세설명 -->
    <UFormField
      label="상세설명"
      required
      :error="errors.description"
    >
      <UTextarea
        v-model="description"
        class="w-full"
      />
    </UFormField>
  </div>
</template>
