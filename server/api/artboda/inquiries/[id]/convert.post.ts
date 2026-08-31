interface ConvertBody {
  organizationId: string
}

// 계약 전환: quoted → converted, artboda.contracts row를 draft로 생성(1:1, inquiry_id unique).
export default defineEventHandler(async (event) => {
  const { client, adminAccountId } = await requireServiceAdmin(event, 'artboda')
  const id = getRouterParam(event, 'id')
  const body = await readBody<ConvertBody>(event)
  if (!id || !body?.organizationId) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'id, organizationId는 필수입니다.' })
  }

  const { error: contractError } = await client
    .schema('artboda')
    .from('contracts')
    .insert({ organization_id: body.organizationId, inquiry_id: id, status: 'draft' })

  if (contractError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: contractError.message })
  }

  const { error: inquiryError } = await client
    .schema('artboda')
    .from('inquiries')
    .update({ status: 'converted' })
    .eq('id', id)
    .eq('status', 'quoted')

  if (inquiryError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: inquiryError.message })
  }

  await client.schema('admin').from('audit_logs').insert({
    admin_account_id: adminAccountId,
    action: 'artboda_inquiry_converted',
    target_resource: { inquiryId: id, organizationId: body.organizationId },
  })

  return { converted: true }
})
