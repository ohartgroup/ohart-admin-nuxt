interface UpdateStatusBody {
  status: 'draft' | 'pending_payment' | 'active' | 'completed' | 'canceled'
}

export default defineEventHandler(async (event) => {
  const { client, adminAccountId, serviceId } = await requireServiceAdmin(event, 'artboda')
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateStatusBody>(event)
  if (!id || !body?.status) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'id, status는 필수입니다.' })
  }

  const { error } = await client.schema('artboda').from('contracts').update({ status: body.status }).eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: error.message })
  }

  await logAuditEvent(event, client, {
    adminAccountId,
    action: 'artboda_contract_status_changed',
    targetServiceId: serviceId,
    targetResource: { contractId: id, status: body.status },
  })

  return { updated: true }
})
