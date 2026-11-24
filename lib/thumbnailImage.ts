import type { ImageUrlBuilder, SanityImageSource } from '@sanity/image-url'

export type ThumbnailImage = {
  asset?: { _ref?: string }
  crop?: { left?: number; top?: number; right?: number; bottom?: number }
  hotspot?: { x?: number; y?: number; width?: number; height?: number }
  thumbnailZoom?: number
}

export const WALL_THUMBNAIL_WIDTH = 900
export const WALL_THUMBNAIL_HEIGHT = 640
export const MAX_THUMBNAIL_ZOOM = 4

export function thumbnailImageUrl(builder: ImageUrlBuilder, image: ThumbnailImage) {
  const ref = image.asset?._ref
  const dimensions = ref?.match(/^image-[^-]+-(\d+)x(\d+)-/)
  if (!ref || !dimensions) return ''

  const url = builder.image(image as SanityImageSource)
    .width(WALL_THUMBNAIL_WIDTH).height(WALL_THUMBNAIL_HEIGHT).fit('crop').auto('format')
  const zoom = Math.min(MAX_THUMBNAIL_ZOOM, image.thumbnailZoom ?? 1)
  // At 1×, retain the exact crop Sanity calculates from the saved hotspot.
  if (!Number.isFinite(zoom) || zoom <= 1) return url.url()

  const sourceWidth = Number(dimensions[1])
  const sourceHeight = Number(dimensions[2])
  const left = Math.round((image.crop?.left ?? 0) * sourceWidth)
  const top = Math.round((image.crop?.top ?? 0) * sourceHeight)
  const right = Math.round((1 - (image.crop?.right ?? 0)) * sourceWidth)
  const bottom = Math.round((1 - (image.crop?.bottom ?? 0)) * sourceHeight)
  const availableWidth = right - left
  const availableHeight = bottom - top
  if (availableWidth < 1 || availableHeight < 1) return url.url()

  const aspect = WALL_THUMBNAIL_WIDTH / WALL_THUMBNAIL_HEIGHT
  const height = Math.max(1, Math.round(Math.min(availableHeight, availableWidth / aspect) / zoom))
  const width = Math.min(availableWidth, Math.max(1, Math.round(height * aspect)))
  const x = Math.round((image.hotspot?.x ?? 0.5) * sourceWidth - width / 2)
  const y = Math.round((image.hotspot?.y ?? 0.5) * sourceHeight - height / 2)

  return url.rect(
    Math.min(right - width, Math.max(left, x)),
    Math.min(bottom - height, Math.max(top, y)),
    width, height
  ).url()
}
