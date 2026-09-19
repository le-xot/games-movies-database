export const DEFAULT_CORS_ORIGINS = 'http://localhost:3000,http://localhost:5173,https://le-xot.dev'

export function parseCorsOrigins(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
}

export function isOriginAllowed(origin: string | undefined, allowed: string[]): boolean {
  if (!origin) return true
  return allowed.includes(origin)
}
