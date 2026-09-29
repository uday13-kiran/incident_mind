import type { Incident, Investigation, Memory, Severity, Status } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

function token() {
  return localStorage.getItem('incidentmind_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const accessToken = token()
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || `Request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function login(email: string, password: string) {
  const body = new URLSearchParams()
  body.set('username', email)
  body.set('password', password)
  const response = await fetch(`${API_BASE}api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail || 'Login failed')
  }
  const data = await response.json() as { access_token: string }
  localStorage.setItem('incidentmind_token', data.access_token)
}

export async function register(name: string, email: string, password: string) {
  return request('api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export async function listIncidents() {
  return request<Incident[]>('api/v1/incidents')
}

export async function getIncident(id: number) {
  return request<Incident>(`api/v1/incidents/${id}`)
}

export async function createIncident(input: { title: string; service: string; severity: Severity; description: string }) {
  return request<Incident>('api/v1/incidents', { method: 'POST', body: JSON.stringify(input) })
}

export async function updateIncident(id: number, input: Partial<Incident>) {
  const allowed: Record<string, unknown> = {}
  for (const key of ['title', 'service', 'severity', 'description', 'status', 'root_cause', 'resolution']) {
    if (input[key as keyof Incident] !== undefined) allowed[key] = input[key as keyof Incident]
  }
  return request<Incident>(`api/v1/incidents/${id}`, { method: 'PUT', body: JSON.stringify(allowed) })
}

export async function deleteIncident(id: number) {
  return request<void>(`api/v1/incidents/${id}`, { method: 'DELETE' })
}

export async function investigateIncident(id: number, query?: string) {
  return request<Investigation>(`api/v1/ai/investigate/${id}`, {
    method: 'POST',
    body: JSON.stringify(query ? { query } : {}),
  })
}

export async function searchMemory(query: string) {
  return request<Memory[]>(`api/v1/ai/memory?query=${encodeURIComponent(query)}`)
}

export function logout() {
  localStorage.removeItem('incidentmind_token')
}

export function isAuthenticated() {
  return Boolean(token())
}

export type { Status }
