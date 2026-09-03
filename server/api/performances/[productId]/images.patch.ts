// 이미지 순서 변경 전용 — 배열 순서 = 노출 순서 = 첫 번째가 대표 이미지라서,
// 클라이언트가 재정렬한 최종 URL 배열을 그대로 덮어쓰기만 하면 된다(Storage 쓰기는 없음).
export default defineEventHandler(async (event) => {
  const { client, adminAccountId, isSuperAdmin, serviceIds } = await requireCatalogAdmin(event)
  const productId = getRouterParam(event, 'productId')
  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'productId는 필수입니다.' })
  }

  const body = await readBody<{ images: string[] }>(event)
  if (!Array.isArray(body?.images)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'images 배열이 필요합니다.' })
  }

  const { data: product, error: productError } = await client
    .from('products')
    .select('service_id')
    .eq('id', productId)
    .eq('deleted', false)
    .maybeSingle()

  if (productError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: productError.message })
  }
  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: '공연작품을 찾을 수 없습니다.' })
  }
  if (!isSuperAdmin && !serviceIds.includes(product.service_id)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: '본인이 관리하는 서비스의 공연작품만 수정할 수 있습니다.' })
  }

  const { error: updateError } = await client
    .from('performance_catalog')
    .update({ images: body.images })
    .eq('product_id', productId)

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: updateError.message })
  }

  await logAuditEvent(event, client, {
    adminAccountId,
    action: 'performance_images_reordered',
    targetServiceId: product.service_id,
    targetResource: { productId },
  })

  return { images: body.images }
})
