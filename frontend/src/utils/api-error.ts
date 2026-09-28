function normalizeMessage(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null
  if (Array.isArray(value)) {
    const joined = value.filter((item): item is string => typeof item === 'string').join('; ')
    return joined || null
  }
  return null
}

export async function parseApiError(
  error: unknown,
  fallback = 'Неизвестная ошибка',
): Promise<string> {
  try {
    if (error instanceof Response) {
      const errorData = await error.clone().json()
      return normalizeMessage(errorData?.message) ?? fallback
    }
    if (typeof error === 'object' && error !== null) {
      const maybe = error as { json?: unknown; error?: { message?: unknown }; message?: unknown }
      if (typeof maybe.json === 'function') {
        const errorData = await (error as Response).clone().json()
        return normalizeMessage(errorData?.message) ?? fallback
      }
      return normalizeMessage(maybe.error?.message) ?? normalizeMessage(maybe.message) ?? fallback
    }
  } catch (parseError) {
    console.error('Failed to parse error response:', parseError)
  }
  return fallback
}
