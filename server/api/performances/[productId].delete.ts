// 관리자 화면 삭제는 실제 row를 지우지 않고 deleted=true로만 처리한다(soft delete) —
// products/performance_catalog 둘 다 자체 deleted 컬럼을 갖고 있어서 같이 true로 바꿔줘야
// 목록(performances.get.ts)에서 완전히 사라진다. exposures/이미지는 그대로 남겨둔다(복구 시
// 다시 필요하고, product_service_exposures는 애초에 deleted 컬럼이 없음).
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
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: '본인이 관리하는 서비스의 공연작품만 삭제할 수 있습니다.' })
  }

  const { error: productError } = await client
    .from('products')
    .update({ deleted: true })
    .eq('id', productId)

  if (productError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: productError.message })
  }

  const { error: catalogError } = await client
    .from('performance_catalog')
    .update({ deleted: true })
    .eq('product_id', productId)

  if (catalogError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: catalogError.message })
  }

  await logAuditEvent(event, client, {
    adminAccountId,
    action: 'performance_catalog_deleted',
    targetServiceId: existing.service_id,
    targetResource: { productId },
  })

  return { deleted: true }
})
