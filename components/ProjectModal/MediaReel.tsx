'use client'

import { useState } from 'react'
import MediaItem, { type MediaItemData } from './MediaItem'
import Lightbox from './Lightbox'
import type { WallProject } from '@/lib/types'

interface MediaReelProps {
  project: WallProject
  videos: ReturnType<typeof getProjectVideos>
}

const disArtPosters = new Map([
  ['/a-good-crisis', '/dis-art-a-good-crisis.webp'],
  ['/natural-gods', '/dis-art-natural-gods.webp'],
])

export function getProjectVideos(project: WallProject) {
  const videos: Array<{ key: string; item: Extract<MediaItemData, { kind: 'video' | 'externalVideo' }> }> = []
  const seen = new Set<string>()
  for (const link of project.watchOn ?? []) {
    const href = link.url?.trim()
    if (!href) continue
    const match = href.match(/^https?:\/\/(?:www\.)?dis\.art(\/[^?#]*)?(?:[?#].*)?$/i)
    if (!match) continue
    const path = (match[1] ?? '/').replace(/\/$/, '') || '/'
    if (seen.has(path)) continue
    seen.add(path)
    videos.push({
      key: `dis.art${path}`,
      item: {
        kind: 'externalVideo',
        href,
        title: project.title,
        poster: disArtPosters.get(path) ?? project.photos?.[0]?.url,
      },
    })
  }
  for (const video of project.videos ?? []) {
    videos.push({ key: video._key, item: { kind: 'video', data: video } })
  }
  return videos
}

export default function MediaReel({ project, videos }: MediaReelProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <div className="modal-media-reel">
      {videos.map(({ key, item }, index) => (
        <div key={key} className={index === 0 ? 'modal-reel-first-video' : undefined}>
          <MediaItem {...item} />
        </div>
      ))}

      {(project.audio ?? []).map((audio) => (
        <MediaItem key={audio._key} kind="audio" data={audio} />
      ))}

      {(project.photos ?? []).map((photo, i) => (
        <MediaItem
          key={photo._key}
          kind="photo"
          data={photo}
          index={i}
          onLightbox={setLightboxIndex}
        />
      ))}

      {lightboxIndex !== null && (
        <Lightbox
          photos={project.photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNav={setLightboxIndex}
        />
      )}
    </div>
  )
}
