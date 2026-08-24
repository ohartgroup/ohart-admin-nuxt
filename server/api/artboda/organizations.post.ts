interface CreateOrgBody {
  name: string
  orgType: string
  businessRegistrationNumber?: string
  address?: string
  billingEmail?: string
}

export default defineEventHandler(async (event) => {
  const { client } = await requireServiceAdmin(event, 'artboda')
  const body = await readBody<CreateOrgBody>(event)
  if (!body?.name || !body?.orgType) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'name, orgType는 필수입니다.' })
  }

  const { error } = await client
    .schema('artboda')
    .from('organizations')
    .insert({
      name: body.name,
      org_type: body.orgType as never,
      business_registration_number: body.businessRegistrationNumber || null,
      address: body.address || null,
      billing_email: body.billingEmail || null,
    })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: error.message })
  }
  return { created: true }
})
