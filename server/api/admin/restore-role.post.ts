interface RestoreRoleBody {
  roleAssignmentId: string
}

// revoke-role.post.ts의 반대 — 회수된(deleted=true) 권한을 다시 deleted=false로 되돌린다.
// 같은 권한을 "신규 부여"로 다시 만들 수도 있지만, 그러면 이력이 새 row로 쪼개지고
// 회수 사유 등 원래 맥락이 끊긴다 — 원래 row를 그대로 복구하는 편이 낫다.
export default defineEventHandler(async (event) => {
  const { client } = await requireSuperAdmin(event)

  const body = await readBody<RestoreRoleBody>(event)
  if (!body?.roleAssignmentId) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'roleAssignmentId는 필수입니다.' })
  }

  const { error } = await client
    .schema('admin')
    .from('role_assignments')
    .update({ deleted: false })
    .eq('id', body.roleAssignmentId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: error.message })
  }

  return { restored: true }
})
