export type PerformanceType = 'direct' | 'brokered'
export type ProductStatus = 'draft' | 'published' | 'blocked'

export interface PerformanceListItem {
  product_id: string
  name: string
  price: number
  category: string | null
  status: ProductStatus
  service_id: string
  audience_age: string | null
  genre: string | null
  duration_minutes: number | null
  performance_type: PerformanceType | null
  creator_id: string | null
  exposed_service_ids: string[]
}
