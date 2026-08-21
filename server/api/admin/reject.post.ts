interface RejectBody {
  adminAccountId: string
}

// 거부는 계정을 지우지 않고 suspended로 바꾼다 — 감사 기록을 남기고,
// 같은 이메일로 다시 가입 시도해도 signup-check가 기존 row를 찾아 pending으로 되돌리지 않게 하기 위함.
export default defineEventHandler(async (event) => {
  const { client } = await requireSuperAdmin(event)

  const body = await readBody<RejectBody>(event)
  if (!body?.adminAccountId) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'adminAccountId는 필수입니다.' })
  }

  const { error } = await client
    .schema('admin')
    .from('admin_accounts')
    .update({ status: 'suspended' })
    .eq('id', body.adminAccountId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: error.message })
  }

  return { rejected: true }
})
