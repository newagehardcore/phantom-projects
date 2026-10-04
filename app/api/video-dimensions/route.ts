const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'])

function getYouTubeVideoId(videoUrl: URL): string | null {
  const host = videoUrl.hostname.toLowerCase()
  if (host === 'youtu.be' || host === 'www.youtu.be') return videoUrl.pathname.split('/').filter(Boolean)[0] ?? null
  if (videoUrl.pathname === '/watch') return videoUrl.searchParams.get('v')
  const segments = videoUrl.pathname.split('/').filter(Boolean)
  if (['embed', 'shorts', 'live', 'v'].includes(segments[0] ?? '')) return segments[1] ?? null
  return null
}

async function getYouTubeThumbnailDimensions(videoUrl: URL): Promise<{ width: number; height: number } | null> {
  const videoId = getYouTubeVideoId(videoUrl)
  if (!videoId || !/^[\w-]{6,}$/.test(videoId)) return null

  // Thumbnail dimensions often retain square and portrait upload ratios,
  // unlike YouTube's default 16:9 player dimensions.
  for (const quality of ['maxresdefault', 'sddefault', 'hqdefault']) {
    try {
      const response = await fetch(`https://i.ytimg.com/vi/${videoId}/${quality}.jpg`, { next: { revalidate: 86400 } })
      if (!response.ok) continue
      const dimensions = getJpegDimensions(new Uint8Array(await response.arrayBuffer()))
      if (dimensions) return dimensions
    } catch {
      // Try the next available thumbnail size.
    }
  }
  return null
}

function getJpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])
  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null
    const marker = bytes[offset + 1]
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (frameMarkers.has(marker)) {
      return {
        height: (bytes[offset + 5] << 8) | bytes[offset + 6],
        width: (bytes[offset + 7] << 8) | bytes[offset + 8],
      }
    }
    if (length < 2) return null
    offset += 2 + length
  }
  return null
}

export async function GET(request: Request) {
  const rawUrl = new URL(request.url).searchParams.get('url')
  if (!rawUrl) return Response.json({ error: 'Missing video URL' }, { status: 400 })

  let videoUrl: URL
  try {
    videoUrl = new URL(rawUrl)
  } catch {
    return Response.json({ error: 'Invalid video URL' }, { status: 400 })
  }

  if (videoUrl.protocol !== 'https:' && videoUrl.protocol !== 'http:') {
    return Response.json({ error: 'Unsupported video URL' }, { status: 400 })
  }

  const host = videoUrl.hostname.toLowerCase()
  const isYouTube = YOUTUBE_HOSTS.has(host)
  const isVimeo = host === 'vimeo.com' || host.endsWith('.vimeo.com')
  if (!isYouTube && !isVimeo) {
    return Response.json({ error: 'Only YouTube and Vimeo URLs are supported' }, { status: 422 })
  }

  const endpoint = new URL(isYouTube ? 'https://www.youtube.com/oembed' : 'https://vimeo.com/api/oembed.json')
  endpoint.searchParams.set('url', videoUrl.toString())
  endpoint.searchParams.set('format', 'json')
  if (isYouTube) endpoint.searchParams.set('maxwidth', '1280')

  try {
    if (isYouTube) {
      const thumbnailDimensions = await getYouTubeThumbnailDimensions(videoUrl)
      if (thumbnailDimensions) {
        return Response.json(thumbnailDimensions, {
          headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
        })
      }
    }

    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    })
    if (!response.ok) return Response.json({ error: 'Video dimensions unavailable' }, { status: 502 })

    const metadata = await response.json() as { width?: number; height?: number }
    if (!Number.isFinite(metadata.width) || !Number.isFinite(metadata.height) || !metadata.width || !metadata.height) {
      return Response.json({ error: 'Video dimensions unavailable' }, { status: 502 })
    }

    return Response.json({ width: metadata.width, height: metadata.height }, {
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
    })
  } catch {
    return Response.json({ error: 'Video dimensions unavailable' }, { status: 502 })
  }
}
