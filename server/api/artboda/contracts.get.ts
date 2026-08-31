// public.payments/artboda.organizations 조인은 스키마 경계 때문에 PostgREST 자동 임베딩이 불안정해서 따로 조회 후 합친다.
export default defineEventHandler(async (event) => {
  const { client } = await requireServiceAdmin(event, 'artboda')

  const { data: contracts, error: contractsError } = await client
    .schema('artboda')
    .from('contracts')
    .select('id, organization_id, inquiry_id, payment_id, contract_number, signed_at, status, total_amount, created_at')
    .eq('deleted', false)
    .order('created_at', { ascending: false })

  if (contractsError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: contractsError.message })
  }
  if (contracts.length === 0) {
    return []
  }

  const [{ data: orgs, error: orgsError }, { data: bookings, error: bookingsError }] = await Promise.all([
    client.schema('artboda').from('organizations').select('id, name').in('id', contracts.map(c => c.organization_id)),
    client.schema('artboda').from('contract_bookings').select('id, contract_id, booking_id').in('contract_id', contracts.map(c => c.id)),
  ])

  if (orgsError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: orgsError.message })
  }
  if (bookingsError) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: bookingsError.message })
  }

  return contracts.map(contract => ({
    id: contract.id,
    organizationName: orgs.find(o => o.id === contract.organization_id)?.name ?? null,
    inquiryId: contract.inquiry_id,
    hasPayment: contract.payment_id !== null,
    contractNumber: contract.contract_number,
    signedAt: contract.signed_at,
    status: contract.status,
    totalAmount: contract.total_amount,
    bookingCount: bookings.filter(b => b.contract_id === contract.id).length,
    createdAt: contract.created_at,
  }))
})
