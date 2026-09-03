import type { PerformanceType, ProductStatus } from '~/types/performance'
import type { Json } from '~/types/database.types'

interface UpdatePerformanceBody {
  name: string
  price: number
  categoryId?: string
  status?: ProductStatus
  serviceId: string
  exposedServiceIds: string[]
  audienceAge?: string
  genreId?: string
  durationMinutes?: number
  description?: string
  images?: unknown
  performanceType?: PerformanceType
  creatorId?: string
}

// performances.post.ts와 동일하게 service-role 클라이언트가 RLS를 우회하므로 권한 검증을
// 여기서 직접 한다. RLS admin_write 정책의 using(기존 service_id)/with check(새 service_id)
// 의미를 그대로 재현 — 소유 서비스를 바꾸는 경우 "예전 서비스"와 "새 서비스" 둘 다에 대해
// service_admin이어야 한다(그렇지 않으면 관리 권한 없는 서비스로 슬쩍 옮겨버릴 수 있음).
export default defineEventHandler(async (event) => {
  const { client, adminAccountId, isSuperAdmin, serviceIds } = await requireCatalogAdmin(event)
  const productId = getRouterParam(event, 'productId')
  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'productId는 필수입니다.' })
  }

  const body = await readBody<UpdatePerformanceBody>(event)
  // 폼(Form.vue)의 모든 필드를 필수값으로 취급하기로 했다 — 클라이언트 검증을 우회해서
  // 직접 호출해도 서버가 한 번 더 막는다. 수정 시점엔 이미지가 body에 항상 실려온다
  // (등록과 달리 productId가 이미 있어서 즉시 업로드되므로) — 그래서 여기선 images도 검사.
  if (
    !body?.name || body.price == null || !body?.serviceId
    || !body?.exposedServiceIds?.length || !body?.categoryId || !body?.genreId
    || !body?.audienceAge || body.durationMinutes == null || !body?.performanceType
    || !body?.description || !Array.isArray(body.images) || body.images.length === 0
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: '모든 항목은 필수입니다.' })
  }
  if (body.durationMinutes % 5 !== 0) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: '러닝타임은 5분 단위로 입력해야 합니다.' })
  }

  const { data: existing, error: existingError } = await client
    .from('products')
    .select('id, service_id')
    .eq('id', productId)
    .eq('deleted', false)
    .maybeSingle()

  if (existingError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: existingError.message })
  }
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: '공연작품을 찾을 수 없습니다.' })
  }

  const exposedServiceIds = [...new Set([body.serviceId, ...(body.exposedServiceIds ?? [])])]

  if (!isSuperAdmin) {
    if (!serviceIds.includes(existing.service_id)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: '본인이 관리하는 서비스의 공연작품만 수정할 수 있습니다.' })
    }
    if (!serviceIds.includes(body.serviceId)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: '소유 서비스는 본인이 관리하는 서비스여야 합니다.' })
    }
    const unauthorizedExposure = exposedServiceIds.find(id => !serviceIds.includes(id))
    if (unauthorizedExposure) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: '본인이 관리하지 않는 서비스에는 노출을 추가할 수 없습니다.' })
    }
  }

  const { error: productError } = await client
    .from('products')
    .update({
      name: body.name,
      price: body.price,
      category_id: body.categoryId ?? null,
      status: body.status ?? 'draft',
      service_id: body.serviceId,
    })
    .eq('id', productId)

  if (productError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: productError.message })
  }

  const { error: catalogError } = await client
    .from('performance_catalog')
    .update({
      creator_id: body.creatorId ?? null,
      audience_age: body.audienceAge ?? null,
      genre_id: body.genreId ?? null,
      duration_minutes: body.durationMinutes ?? null,
      description: body.description ?? null,
      images: (body.images as Json) ?? null,
      performance_type: body.performanceType ?? null,
    })
    .eq('product_id', productId)

  if (catalogError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: catalogError.message })
  }

  // 노출 서비스는 diff 대신 delete-then-insert — 목록이 작고(서비스 3~4개) 매번 전체를
  // 새로 넣는 편이 diff 로직보다 단순하고 실수할 여지가 적다.
  const { error: deleteExposureError } = await client
    .from('product_service_exposures')
    .delete()
    .eq('product_id', productId)

  if (deleteExposureError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: deleteExposureError.message })
  }

  const { error: insertExposureError } = await client
    .from('product_service_exposures')
    .insert(exposedServiceIds.map(serviceId => ({ product_id: productId, service_id: serviceId })))

  if (insertExposureError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: insertExposureError.message })
  }

  await logAuditEvent(event, client, {
    adminAccountId,
    action: 'performance_catalog_updated',
    targetServiceId: body.serviceId,
    targetResource: { productId, serviceId: body.serviceId, exposedServiceIds },
  })

  return { updated: true, productId }
})
