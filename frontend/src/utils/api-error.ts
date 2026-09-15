export async function parseApiError(err: any, fallback = 'Неизвестная ошибка'): Promise<string> {
  try {
    if (err instanceof Response || (err && typeof err.json === 'function')) {
      const errorData = await err.clone().json()
      return errorData.message || fallback
    }
    if (err?.error?.message) return err.error.message
    if (err?.message) return err.message
  } catch (parseError) {
    console.error('Failed to parse error response:', parseError)
  }
  return fallback
}
