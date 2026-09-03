export type PerformanceType = 'direct' | 'brokered'
export type ProductStatus = 'draft' | 'published' | 'blocked'
export type AudienceAgeRange = 'all' | '10s' | '20s' | '30s' | '40s' | '50s' | '60s' | '70s_plus'

export interface PerformanceListItem {
  product_id: string
  deleted: boolean
  name: string
  price: number
  category_id: string | null
  status: ProductStatus
  service_id: string
  audience_age: AudienceAgeRange[] | null
  genre_id: string | null
  duration_minutes: number | null
  description: string | null
  images: string[] | null
  performance_type: PerformanceType | null
  creator_id: string | null
  exposed_service_ids: string[]
}
