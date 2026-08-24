export default defineEventHandler(async (event) => {
  const { client } = await requireServiceAdmin(event, 'artboda')

  const { data, error } = await client
    .schema('artboda')
    .from('inquiries')
    .select('id, reference_code, contact_name, contact_department, contact_email, desired_schedule, venue, target_audience, expected_audience, performance_count, budget_range, requested_documents, agreed_to_privacy, status, created_at')
    .eq('deleted', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: error.message })
  }
  return data
})
