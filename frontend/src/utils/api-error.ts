export async function parseApiError(
  error: unknown,
  fallback = 'Неизвестная ошибка',
): Promise<string> {
  try {
    if (error instanceof Response) {
      const errorData = await error.clone().json()
      return errorData.message || fallback
    }
    if (typeof error === 'object' && error !== null) {
      const maybe = error as { json?: unknown; error?: { message?: unknown }; message?: unknown }
      if (typeof maybe.json === 'function') {
        const errorData = await (error as Response).clone().json()
        return errorData.message || fallback
      }
      if (typeof maybe.error?.message === 'string') return maybe.error.message
      if (typeof maybe.message === 'string') return maybe.message
    }
  } catch (parseError) {
    console.error('Failed to parse error response:', parseError)
  }
  return fallback
}
