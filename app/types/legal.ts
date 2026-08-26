export interface LegalArticleBlock {
  type: 'article'
  id: string
  heading: string
  body: string
}
export interface LegalTableBlock {
  type: 'table'
  id: string
  title: string
  rows: { label: string, value: string }[]
}
export type LegalBlock = LegalArticleBlock | LegalTableBlock

export interface LegalDocumentVersion {
  id: string
  doc_type: 'terms' | 'privacy'
  version: number
  effective_date: string
  title: string
  eyebrow: string
  content: { blocks: LegalBlock[] }
  created_at: string
}
