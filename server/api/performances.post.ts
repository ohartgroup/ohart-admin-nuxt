import type { PerformanceType, ProductStatus } from '~/types/performance'
import type { Json } from '~/types/database.types'

interface CreatePerformanceBody {
  name: string
  price: number
  category?: string
  status?: ProductStatus
  serviceId: string
  exposedServiceIds: string[]
  audienceAge?: string
  genre?: string
  durationMinutes?: number
  description?: string
  images?: unknown
  performanceType?: PerformanceType
  creatorId?: string
}

// 이 API를 쓰는 client는 requireCatalogAdmin이 돌려주는 service-role 클라이언트라 RLS를
// 우회한다 — "소유 서비스는 내가 관리하는 서비스여야 한다", "노출 서비스도 내가 관리하는
// 서비스여야 한다"는 권한 검증을 여기서 직접 해줘야 한다(super_admin은 전체 허용).
export default defineEventHandler(async (event) => {
  const { client, adminAccountId, isSuperAdmin, serviceIds } = await requireCatalogAdmin(event)
  const body = await readBody<CreatePerformanceBody>(event)

  if (!body?.name || body.price == null || !body?.serviceId) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'name, price, serviceId는 필수입니다.' })
  }

  const exposedServiceIds = [...new Set([body.serviceId, ...(body.exposedServiceIds ?? [])])]

  if (!isSuperAdmin) {
    if (!serviceIds.includes(body.serviceId)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: '소유 서비스는 본인이 관리하는 서비스여야 합니다.' })
    }
    const unauthorizedExposure = exposedServiceIds.find(id => !serviceIds.includes(id))
    if (unauthorizedExposure) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: '본인이 관리하지 않는 서비스에는 노출을 추가할 수 없습니다.' })
    }
  }

  const { data: product, error: productError } = await client
    .from('products')
    .insert({
      name: body.name,
      price: body.price,
      category: body.category ?? null,
      status: body.status ?? 'draft',
      service_id: body.serviceId,
    })
    .select('id')
    .single()

  if (productError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: productError.message })
  }

  const { error: catalogError } = await client
    .from('performance_catalog')
    .insert({
      product_id: product.id,
      creator_id: body.creatorId ?? null,
      audience_age: body.audienceAge ?? null,
      genre: body.genre ?? null,
      duration_minutes: body.durationMinutes ?? null,
      description: body.description ?? null,
      images: (body.images as Json) ?? null,
      performance_type: body.performanceType ?? null,
    })

  if (catalogError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: catalogError.message })
  }

  const { error: exposureError } = await client
    .from('product_service_exposures')
    .insert(exposedServiceIds.map(serviceId => ({ product_id: product.id, service_id: serviceId })))

  if (exposureError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: exposureError.message })
  }

  await client.schema('admin').from('audit_logs').insert({
    admin_account_id: adminAccountId,
    action: 'performance_catalog_created',
    target_resource: { productId: product.id, serviceId: body.serviceId, exposedServiceIds },
  })

  return { created: true, productId: product.id }
})
