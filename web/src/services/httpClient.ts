import { apiUrl } from '../api'
import type { ApiErrorPayload } from '../types/account'

export class ApiError extends Error {
  readonly status: number
  readonly details: string[]

  constructor(message: string, status: number, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function parseErrorMessage(payload: ApiErrorPayload | null, status: number): {
  message: string
  details: string[]
} {
  if (payload?.message) {
    if (Array.isArray(payload.message)) {
      const cleaned = payload.message.filter(
        (item) => typeof item === 'string' && item.trim().length > 0,
      )
      if (cleaned.length > 0) {
        return { message: cleaned[0], details: cleaned }
      }
    } else if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
      return { message: payload.message, details: [payload.message] }
    }
  }

  if (payload?.error && typeof payload.error === 'string' && payload.error.trim().length > 0) {
    return { message: payload.error, details: [payload.error] }
  }

  if (status >= 500) {
    return {
      message: `El servidor respondió con un error interno (HTTP ${status}). Intenta nuevamente en unos momentos.`,
      details: [],
    }
  }

  return {
    message: `Error de comunicación con el servidor (HTTP ${status}).`,
    details: [],
  }
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

export async function httpRequest<T>(
  path: string,
  options: HttpRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, signal } = options
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError(
      'No se pudo conectar con la API. Verifica que el servidor esté en ejecución y accesible.',
      0,
    )
  }

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null
    try {
      payload = (await response.json()) as ApiErrorPayload
    } catch {
      payload = null
    }
    const { message, details } = parseErrorMessage(payload, response.status)
    throw new ApiError(message, response.status, details)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new ApiError(
      'La respuesta recibida de la API no tiene un formato JSON válido.',
      response.status,
    )
  }
}
