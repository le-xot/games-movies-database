import type { UserEntity } from '@/modules/user/user.entity'
import type { Request } from 'express'

/** Express request with cookie-parser output narrowed to string values. */
export interface RequestWithCookies extends Request {
  cookies: Record<string, string | undefined>
}

/** Request guaranteed to carry an authenticated user (AuthGuard ran). */
export interface AuthenticatedRequest extends RequestWithCookies {
  user: UserEntity
}

export function getCookie(request: RequestWithCookies, name: string): string | undefined {
  return request.cookies?.[name]
}
