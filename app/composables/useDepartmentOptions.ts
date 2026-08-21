import type { Database } from '~/types/database.types'

// profile.vue/approvals.vue의 부서 선택 드롭다운이 공유하는 로직.
// 그룹(parent_id 없음)>팀(parent_id 있음) 2단계 구조를 "그룹 > 팀" 라벨로 펼쳐서 보여준다.
export const useDepartmentOptions = () => {
  const supabase = useSupabaseClient<Database>()
  const options = ref<{ label: string, value: string }[]>([])

  const load = async () => {
    const { data } = await supabase
      .schema('admin')
      .from('departments')
      .select('id, name, parent_id')
      .eq('active', true)
      .eq('deleted', false)

    const rows = data ?? []
    const byId = new Map(rows.map(row => [row.id, row]))

    options.value = rows
      .map((row) => {
        const parent = row.parent_id ? byId.get(row.parent_id) : null
        return {
          label: parent ? `${parent.name} > ${row.name}` : row.name,
          value: row.id,
          sortKey: `${parent?.name ?? row.name}-${parent ? 1 : 0}-${row.name}`,
        }
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ label, value }) => ({ label, value }))
  }

  return { options, load }
}
