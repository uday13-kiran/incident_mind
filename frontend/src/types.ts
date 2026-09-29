export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type Status = 'open' | 'investigating' | 'resolved' | 'closed'

export interface Incident {
  id: number
  organization_id: number
  title: string
  service: string
  severity: Severity
  description: string
  status: Status
  root_cause: string | null
  resolution: string | null
  created_at: string
  updated_at: string
}

export interface Investigation {
  incident_id: number
  summary: string
  likely_root_cause: string
  recommended_actions: string[]
  confidence: string
  related_memory_ids: string[]
  memories: Memory[]
}

export interface Memory {
  id: string
  type: string
  text: string
  context: string
}
