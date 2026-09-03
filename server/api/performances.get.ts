// 목록 스코프: super_admin은 전체, service_admin은 자기가 배정된 서비스에 "노출된"
// (product_service_exposures 기준) 공연만 조회 — 소유(products.service_id)가 아니라 노출 기준.
// 소유 서비스가 아니어도 자기 스토어프론트에 걸린 공연은 볼 수 있어야 하기 때문(수정은 RLS가 소유 기준으로 막음).
export default defineEventHandler(async (event) => {
  const { client, isSuperAdmin, serviceIds } = await requireCatalogAdmin(event)

  let productIdsInScope: string[] | null = null
  if (!isSuperAdmin) {
    const { data: exposures, error: exposureError } = await client
      .from('product_service_exposures')
      .select('product_id')
      .in('service_id', serviceIds)

    if (exposureError) {
      throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: exposureError.message })
    }
    productIdsInScope = [...new Set((exposures ?? []).map(e => e.product_id))]

    if (productIdsInScope.length === 0) {
      return []
    }
  }

  let query = client
    .from('performance_catalog')
    .select('product_id, creator_id, audience_age, genre_id, duration_minutes, description, images, performance_type, products!inner(name, price, category_id, status, service_id)')
    .eq('deleted', false)
    .eq('products.deleted', false)
    .order('created_at', { ascending: false })

  if (productIdsInScope) {
    query = query.in('product_id', productIdsInScope)
  }

  const { data: catalog, error: catalogError } = await query
  if (catalogError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: catalogError.message })
  }

  const productIds = catalog.map(c => c.product_id)
  const { data: allExposures, error: allExposuresError } = productIds.length
    ? await client.from('product_service_exposures').select('product_id, service_id').in('product_id', productIds)
    : { data: [], error: null }

  if (allExposuresError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: allExposuresError.message })
  }

  return catalog.map(c => ({
    product_id: c.product_id,
    name: c.products.name,
    price: c.products.price,
    category_id: c.products.category_id,
    status: c.products.status,
    service_id: c.products.service_id,
    audience_age: c.audience_age,
    genre_id: c.genre_id,
    duration_minutes: c.duration_minutes,
    description: c.description,
    images: c.images as string[] | null,
    performance_type: c.performance_type,
    creator_id: c.creator_id,
    exposed_service_ids: (allExposures ?? []).filter(e => e.product_id === c.product_id).map(e => e.service_id),
  }))
})
