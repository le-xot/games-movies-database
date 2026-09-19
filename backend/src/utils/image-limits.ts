import { BadRequestException } from '@nestjs/common'

export const MAX_IMAGE_PIXELS = 25_000_000

export function assertPixelLimit(
  width: number,
  height: number,
  maxPixels = MAX_IMAGE_PIXELS,
): void {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new BadRequestException('Invalid image dimensions')
  }
  if (width * height > maxPixels) {
    throw new BadRequestException('Image is too large')
  }
}
