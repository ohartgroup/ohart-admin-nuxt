// [productId].delete.ts의 반대 — products/performance_catalog 둘 다 deleted=false로 되돌린다.
export default defineEventHandler(async (event) => {
  const { client, adminAccountId, isSuperAdmin, serviceIds } = await requireCatalogAdmin(event)
  const productId = getRouterParam(event, 'productId')
  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'productId는 필수입니다.' })
  }

  const { data: existing, error: existingError } = await client
    .from('products')
    .select('id, service_id')
    .eq('id', productId)
    .maybeSingle()

  if (existingError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: existingError.message })
  }
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: '공연작품을 찾을 수 없습니다.' })
  }
  if (!isSuperAdmin && !serviceIds.includes(existing.service_id)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: '본인이 관리하는 서비스의 공연작품만 복구할 수 있습니다.' })
  }

  const { error: productError } = await client
    .from('products')
    .update({ deleted: false })
    .eq('id', productId)

  if (productError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: productError.message })
  }

  const { error: catalogError } = await client
    .from('performance_catalog')
    .update({ deleted: false })
    .eq('product_id', productId)

  if (catalogError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: catalogError.message })
  }

  await logAuditEvent(event, client, {
    adminAccountId,
    action: 'performance_catalog_restored',
    targetServiceId: existing.service_id,
    targetResource: { productId },
  })

  return { restored: true }
})
