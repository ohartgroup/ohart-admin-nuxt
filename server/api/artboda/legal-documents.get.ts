export default defineEventHandler(async (event) => {
  const { client } = await requireServiceAdmin(event, 'artboda')
  const query = getQuery(event)
  const docType = query.docType as string | undefined

  let request = client
    .schema('artboda')
    .from('legal_document_versions')
    .select('id, doc_type, version, effective_date, title, eyebrow, content, created_at')
    .eq('deleted', false)
    .order('doc_type', { ascending: true })
    .order('effective_date', { ascending: false })

  if (docType) {
    request = request.eq('doc_type', docType)
  }

  const { data, error } = await request

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: error.message })
  }
  return data
})
