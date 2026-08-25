import type { LegalBlock } from '~/types/legal'
import type { Json } from '~/types/database.types'

interface CreateVersionBody {
  docType: 'terms' | 'privacy'
  effectiveDate: string
  title: string
  eyebrow: string
  toc: { id: string, label: string }[]
  blocks: LegalBlock[]
}

// 이미 시행된 버전은 수정하지 않는다(법적 문서 원칙) — 이 엔드포인트는 새 버전 추가 전용,
// PUT/PATCH를 별도로 두지 않는다. version 번호는 기존 최대값+1로 서버가 계산해서
// 클라이언트가 번호를 잘못 넣어 충돌하는 경우를 없앤다.
export default defineEventHandler(async (event) => {
  const { client, adminAccountId } = await requireServiceAdmin(event, 'artboda')
  const body = await readBody<CreateVersionBody>(event)

  if (!body?.docType || !body?.effectiveDate || !body?.title || !body?.eyebrow || !body?.blocks?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'docType, effectiveDate, title, eyebrow, blocks는 필수입니다.' })
  }

  const { data: latest } = await client
    .schema('artboda')
    .from('legal_document_versions')
    .select('version')
    .eq('doc_type', body.docType)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = (latest?.version ?? 0) + 1

  const { error } = await client
    .schema('artboda')
    .from('legal_document_versions')
    .insert({
      doc_type: body.docType,
      version: nextVersion,
      effective_date: body.effectiveDate,
      title: body.title,
      eyebrow: body.eyebrow,
      content: { toc: body.toc, blocks: body.blocks } as unknown as Json,
    })

  if (error) {
    // unique(doc_type, effective_date) 위반은 같은 시행일로 이미 버전이 있다는 뜻.
    const isDuplicate = error.code === '23505'
    throw createError({
      statusCode: isDuplicate ? 409 : 500,
      statusMessage: isDuplicate ? 'Conflict' : 'Internal Server Error',
      message: isDuplicate ? '이미 같은 시행일의 버전이 존재합니다.' : error.message,
    })
  }

  await client.schema('admin').from('audit_logs').insert({
    admin_account_id: adminAccountId,
    action: 'artboda_legal_document_created',
    target_resource: { docType: body.docType, version: nextVersion, effectiveDate: body.effectiveDate },
  })

  return { created: true, version: nextVersion }
})
