import { createHash } from 'node:crypto'
import { apiErrorModels, publicErrors } from '@backend/gateway/errors'
import { enforceRateLimit, type RateLimiter } from '@backend/gateway/rate-limit'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia, t } from 'elysia'

export type ImageVariant = 'poster' | 'avatar'

export interface ImageReader {
  getImage(
    urlEncoded: string,
    variant: ImageVariant,
  ): Promise<{ buffer: Uint8Array; contentType: string }>
}

export interface AvatarReader {
  getAvatar(userId: string): Promise<Uint8Array | null>
}

export interface MediaRouteDeps {
  images: ImageReader
  avatars: AvatarReader
  rateLimit: RateLimiter
}

const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'
const AVATAR_CACHE = 'public, max-age=86400'

export function mediaRoutes({ images, avatars, rateLimit }: MediaRouteDeps) {
  return new Elysia({ name: 'media' })
    .model({ ...apiErrorModels })
    .get(
      '/img',
      async (ctx) => {
        await enforceRateLimit(rateLimit, {
          request: ctx.request,
          route: 'ImgController.getImageContent',
          config: RATE_LIMITS.img,
          ip: ctx.server?.requestIP(ctx.request)?.address,
        })

        const query = ctx.query as { urlEncoded: string; variant?: ImageVariant }
        const variant = query.variant ?? 'poster'
        const { buffer, contentType } = await images.getImage(query.urlEncoded, variant)
        const etag = `"${createHash('sha256').update(`${query.urlEncoded}:${variant}`).digest('hex')}"`

        return new Response(new Uint8Array(buffer), {
          headers: {
            'content-type': contentType,
            'cache-control': IMMUTABLE_CACHE,
            etag,
          },
        })
      },
      {
        query: t.Object({
          urlEncoded: t.String(),
          variant: t.Optional(t.Union([t.Literal('poster'), t.Literal('avatar')])),
        }),
        response: { 200: t.Void(), ...publicErrors() },
      },
    )
    .get(
      '/avatar/:userId',
      async (ctx) => {
        await enforceRateLimit(rateLimit, {
          request: ctx.request,
          route: 'AvatarController.getAvatar',
          config: RATE_LIMITS.public,
          ip: ctx.server?.requestIP(ctx.request)?.address,
        })

        const buffer = await avatars.getAvatar(ctx.params.userId)

        if (!buffer) {
          return new Response(null, { status: 404 })
        }

        return new Response(new Uint8Array(buffer), {
          headers: {
            'content-type': 'image/webp',
            'cache-control': AVATAR_CACHE,
          },
        })
      },
      {
        params: t.Object({ userId: t.String() }),
        response: { 200: t.Void(), ...publicErrors() },
      },
    )
}
