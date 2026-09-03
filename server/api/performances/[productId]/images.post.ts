// 이미지 업로드 — multipart로 여러 파일을 한 번에 받아 performance-images 버킷에 올리고
// (경로 컨벤션: {productId}/{uuid}.{ext}, 0027 마이그레이션의 RLS 컨벤션과 동일),
// 반환된 public URL을 기존 performance_catalog.images 배열 뒤에 이어붙인다.
// 배열 순서 = 노출 순서이므로 "이어붙이기"만으로 새로 올린 이미지가 항상 맨 뒤에 온다.
const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8MB

export default defineEventHandler(async (event) => {
  const { client, adminAccountId, isSuperAdmin, serviceIds } = await requireCatalogAdmin(event)
  const productId = getRouterParam(event, 'productId')
  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'productId는 필수입니다.' })
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

  const parts = await readMultipartFormData(event)
  const files = (parts ?? []).filter(part => part.name === 'files' && part.filename && part.data.length > 0)
  if (files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: '업로드할 이미지가 없습니다.' })
  }

  for (const file of files) {
    if (!file.type?.startsWith('image/')) {
      throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: `이미지 파일만 업로드할 수 있습니다. (${file.filename})` })
    }
    if (file.data.length > MAX_FILE_SIZE) {
      throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: `파일당 최대 8MB까지 업로드할 수 있습니다. (${file.filename})` })
    }
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
  const uploadedUrls: string[] = []

  for (const file of files) {
    const ext = file.filename!.includes('.') ? file.filename!.split('.').pop() : 'bin'
    const path = `${productId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await client.storage
      .from('performance-images')
      .upload(path, file.data, { contentType: file.type })

    if (uploadError) {
      throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: uploadError.message })
    }

    const { data: publicUrl } = client.storage.from('performance-images').getPublicUrl(path)
    uploadedUrls.push(publicUrl.publicUrl)
  }

  const nextImages = [...existingImages, ...uploadedUrls]

  const { error: updateError } = await client
    .from('performance_catalog')
    .update({ images: nextImages })
    .eq('product_id', productId)

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: updateError.message })
  }

  await client.schema('admin').from('audit_logs').insert({
    admin_account_id: adminAccountId,
    action: 'performance_images_uploaded',
    target_resource: { productId, count: uploadedUrls.length },
  })

  return { images: nextImages }
})
