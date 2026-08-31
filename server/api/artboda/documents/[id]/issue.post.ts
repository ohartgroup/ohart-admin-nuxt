// 증빙 발급: requested → generated. 실제 PDF 생성/Storage 업로드는 별도 작업(연동 자리만 마련).
export default defineEventHandler(async (event) => {
  const { client, adminAccountId } = await requireServiceAdmin(event, 'artboda')
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'id는 필수입니다.' })
  }

  const { error } = await client
    .schema('artboda')
    .from('payment_documents')
    .update({ status: 'generated', issued_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'requested')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: error.message })
  }

  await client.schema('admin').from('audit_logs').insert({
    admin_account_id: adminAccountId,
    action: 'artboda_document_issued',
    target_resource: { documentId: id },
  })

  return { issued: true }
})
