// 견적 회신: 문의 상태를 submitted → quoted로 전환한다(실제 견적서 발급은 documents 모듈에서).
export default defineEventHandler(async (event) => {
  const { client, adminAccountId, serviceId } = await requireServiceAdmin(event, 'artboda')
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'id는 필수입니다.' })
  }

  const { error } = await client
    .schema('artboda')
    .from('inquiries')
    .update({ status: 'quoted' })
    .eq('id', id)
    .eq('status', 'submitted')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: error.message })
  }

  await logAuditEvent(event, client, {
    adminAccountId,
    action: 'artboda_inquiry_quoted',
    targetServiceId: serviceId,
    targetResource: { inquiryId: id },
  })

  return { quoted: true }
})
