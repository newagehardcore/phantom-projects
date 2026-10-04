'use client'

import { useEffect, useState } from 'react'
import AudioPlayer from './AudioPlayer'
import { getEmbedUrl } from '@/lib/wallUtils'
import type { PhotoAsset, VideoItem, AudioItem } from '@/lib/types'

// Discriminated union passed to MediaItem so it knows which type to render
export type MediaItemData =
  | { kind: 'photo'; data: PhotoAsset; index: number; onLightbox: (index: number) => void }
  | { kind: 'video'; data: VideoItem }
  | { kind: 'audio'; data: AudioItem }

export default function MediaItem(props: MediaItemData) {
  if (props.kind === 'photo') {
    const { data, index, onLightbox } = props
    return (
      <div style={{ marginBottom: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.url}
          alt={data.alt ?? ''}
          loading="lazy"
          onClick={() => onLightbox(index)}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            cursor: 'zoom-in',
          }}
        />
      </div>
    )
  }

  if (props.kind === 'video') {
    const { data } = props
    if (data._type === 'uploadedVideo') {
      return (
        <div style={{ marginBottom: 16 }}>
          <UploadedVideo src={data.fileUrl} />
          {data.caption && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{data.caption}</div>
          )}
        </div>
      )
    }
    if (data._type === 'linkedVideo') {
      const embedUrl = getEmbedUrl(data.url)
      return (
        <div style={{ marginBottom: 16 }}>
          <LinkedVideoEmbed url={data.url} embedUrl={embedUrl} title={data.caption ?? 'Video'} />
          {data.caption && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{data.caption}</div>
          )}
        </div>
      )
    }
  }

  if (props.kind === 'audio') {
    return <AudioPlayer src={props.data.fileUrl} caption={props.data.caption} />
  }

  return null
}

function UploadedVideo({ src }: { src: string }) {
  const [aspectRatio, setAspectRatio] = useState('16 / 9')

  return (
    <div style={{ width: '100%', aspectRatio, background: '#000' }}>
      <video
        src={src}
        preload="metadata"
        controls
        onLoadedMetadata={(event) => {
          const video = event.currentTarget
          if (video.videoWidth && video.videoHeight) setAspectRatio(`${video.videoWidth} / ${video.videoHeight}`)
        }}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  )
}

function LinkedVideoEmbed({ url, embedUrl, title }: { url: string; embedUrl: string; title: string }) {
  const [dimensions, setDimensions] = useState({ width: 16, height: 9 })

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/video-dimensions?url=${encodeURIComponent(url)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ width: number; height: number }> : null)
      .then((result) => {
        if (result && result.width > 0 && result.height > 0) {
          setDimensions({ width: result.width, height: result.height })
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [url])

  return (
    <div style={{ width: '100%', overflow: 'hidden', background: '#000' }}>
      <iframe
        src={embedUrl}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: `${dimensions.width} / ${dimensions.height}`, border: 0 }}
      />
    </div>
  )
}
