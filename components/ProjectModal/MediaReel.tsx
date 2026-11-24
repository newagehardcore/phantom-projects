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

function soundCloudTracks(project: WallProject) {
  return [...new Set((project.watchOn ?? []).flatMap(({ url }) => {
    if (!url) return []
    try {
      const track = new URL(url)
      if (track.origin === 'https://soundcloud.com' && /^\/[\w-]+\/[\w-]+\/?$/.test(track.pathname)) {
        return [track.origin + track.pathname.replace(/\/$/, '')]
      }
    } catch { /* Ignore invalid CMS URLs. */ }
    return []
  }))]
}

export function getProjectVideos(project: Pick<WallProject, 'watchOn' | 'title' | 'photos' | 'videos'>) {
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
  const heroPhoto = videos.length === 0 ? project.photos?.[0] : undefined
  const photoOffset = heroPhoto ? 1 : 0
  const galleryPhotos = project.photos?.slice(photoOffset)

  return (
    <div className="modal-media-reel">
      {heroPhoto && <MediaItem kind="photo" data={heroPhoto} index={0} onLightbox={setLightboxIndex} priority />}

      {videos.map(({ key, item }, index) => (
        <div key={key} className={index === 0 ? 'modal-reel-first-video' : undefined}>
          <MediaItem {...item} />
        </div>
      ))}

      {(project.audio ?? []).map((audio) => (
        <MediaItem key={audio._key} kind="audio" data={audio} />
      ))}

      {soundCloudTracks(project).map(track => (
        <iframe
          key={track}
          title={`${project.title} on SoundCloud`}
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(track)}&auto_play=false&show_artwork=false&show_related=false`}
          loading="lazy"
          allow="autoplay"
          style={{ display: 'block', width: '100%', height: 166, border: 0, marginBottom: 16 }}
        />
      ))}

      {!!galleryPhotos?.length && (
        <div className={heroPhoto ? 'modal-photo-grid' : 'modal-photo-grid modal-photo-grid--no-hero'}>
          {galleryPhotos.map((photo, i) => (
            <MediaItem
              key={photo._key}
              kind="photo"
              data={photo}
              index={i + photoOffset}
              onLightbox={setLightboxIndex}
            />
          ))}
        </div>
      )}

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
