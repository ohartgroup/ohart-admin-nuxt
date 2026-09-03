// 이미지 삭제 — performance_catalog.images 배열에서 제거하고, 실제 Storage 파일도 같이
// 지워서(orphan 방지) 아무도 참조하지 않는 파일이 버킷에 쌓이지 않게 한다.
export default defineEventHandler(async (event) => {
  const { client, isSuperAdmin, serviceIds } = await requireCatalogAdmin(event)
  const productId = getRouterParam(event, 'productId')
  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'productId는 필수입니다.' })
  }

  const body = await readBody<{ url: string }>(event)
  if (!body?.url) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'url은 필수입니다.' })
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

  const { data: catalog, error: catalogError } = await client
    .from('performance_catalog')
    .select('images')
    .eq('product_id', productId)
    .eq('deleted', false)
    .maybeSingle()

  if (catalogError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: catalogError.message })
  }

  const existingImages = ((catalog?.images as string[] | null) ?? [])
  const nextImages = existingImages.filter(url => url !== body.url)

  const { error: updateError } = await client
    .from('performance_catalog')
    .update({ images: nextImages })
    .eq('product_id', productId)

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: updateError.message })
  }

  // 삭제 대상 URL에서 버킷 내부 경로를 뽑아 실제 파일도 제거 — 경로 파싱이 실패해도
  // (다른 버킷/외부 URL이 잘못 들어온 경우 등) DB 반영은 이미 끝났으니 조용히 넘어간다.
  const pathMarker = '/performance-images/'
  const markerIndex = body.url.indexOf(pathMarker)
  if (markerIndex !== -1) {
    const path = body.url.slice(markerIndex + pathMarker.length)
    await client.storage.from('performance-images').remove([path])
  }

  return { images: nextImages }
})
