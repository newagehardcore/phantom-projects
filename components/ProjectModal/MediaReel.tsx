'use client'

import { useState } from 'react'
import MediaItem from './MediaItem'
import Lightbox from './Lightbox'
import type { WallProject } from '@/lib/types'

interface MediaReelProps {
  project: WallProject
}

export default function MediaReel({ project }: MediaReelProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingLeft: 0 }}>
      {(project.videos ?? []).map((video) => (
        <MediaItem key={video._key} kind="video" data={video} />
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
