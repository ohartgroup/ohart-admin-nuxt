export default defineEventHandler(async (event) => {
  const { client } = await requireServiceAdmin(event, 'artboda')

  const { data, error } = await client
    .schema('artboda')
    .from('organizations')
    .select('id, name, org_type, business_registration_number, address, contract_started_at, billing_email, created_at')
    .eq('deleted', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: error.message })
  }
  return data
})
