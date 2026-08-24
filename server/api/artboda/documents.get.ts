export default defineEventHandler(async (event) => {
  const { client } = await requireServiceAdmin(event, 'artboda')

  const { data, error } = await client
    .schema('artboda')
    .from('payment_documents')
    .select('id, payment_id, contract_id, document_type, status, file_url, issued_at, created_at')
    .eq('deleted', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: error.message })
  }
  return data
})
