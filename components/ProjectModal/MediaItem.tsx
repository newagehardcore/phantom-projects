'use client'

import { useEffect, useState, useRef } from 'react'
import { getVideoPoster } from '@/lib/videoPoster'
import AudioPlayer from './AudioPlayer'
import { getEmbedUrl } from '@/lib/wallUtils'
import type { PhotoAsset, VideoItem, AudioItem } from '@/lib/types'

// Discriminated union passed to MediaItem so it knows which type to render
export type MediaItemData =
  | { kind: 'photo'; data: PhotoAsset; index: number; onLightbox: (index: number) => void }
  | { kind: 'video'; data: VideoItem; fallbackPoster?: string }
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
          <UploadedVideo key={data.fileUrl} src={data.fileUrl} posterUrl={data.posterUrl} title={data.caption ?? 'Video'} fallbackPoster={props.fallbackPoster} />
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
          <LinkedVideoEmbed key={data.url} url={data.url} embedUrl={embedUrl} title={data.caption ?? 'Video'} posterUrl={data.posterUrl} fallbackPoster={props.fallbackPoster} />
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

function VideoPreview({ poster, title, aspectRatio, onPlay }: { poster?: string; title: string; aspectRatio: string; onPlay: () => void }) {
  const [failedPoster, setFailedPoster] = useState<string>()
  const [squarePoster, setSquarePoster] = useState<string>()
  return (
    <button type="button" className="video-preview" style={{ aspectRatio }} aria-label={`Play ${title}`} onClick={onPlay}>
      {poster && poster !== failedPoster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={poster}
          src={poster}
          alt=""
          className={poster === squarePoster ? 'video-preview-square' : undefined}
          onLoad={({ currentTarget: { naturalWidth, naturalHeight } }) => {
            if (Math.abs(naturalWidth - naturalHeight) <= Math.max(naturalWidth, naturalHeight) * 0.05) {
              setSquarePoster(poster)
            }
          }}
          onError={() => setFailedPoster(poster)}
        />
      )}
      <span className="video-preview-label">[ PLAY ]</span>
    </button>
  )
}

function UploadedVideo({ src, posterUrl, title, fallbackPoster }: { src: string; posterUrl?: string; title: string; fallbackPoster?: string }) {
  const [aspectRatio, setAspectRatio] = useState('16 / 9')
  const [generatedPoster, setGeneratedPoster] = useState<string>()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (posterUrl || !videoRef.current) return
    let active = true
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return
      observer.disconnect()
      getVideoPoster(src).then(poster => { if (active) setGeneratedPoster(poster) })
    }, { rootMargin: '200px' })
    observer.observe(videoRef.current)
    return () => { active = false; observer.disconnect() }
  }, [src, posterUrl])

  return (
    <div style={{ width: '100%', aspectRatio, background: '#000', position: 'relative' }}>
      <video
        ref={videoRef}
        src={src}
        poster={posterUrl ?? generatedPoster ?? fallbackPoster}
        preload="metadata"
        controls
        playsInline
        aria-label={title}
        onPlay={() => setPlaying(true)}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget
          if (video.videoWidth && video.videoHeight) setAspectRatio(`${video.videoWidth} / ${video.videoHeight}`)
        }}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
      />
      {!playing && <div style={{ position: 'absolute', inset: 0 }}>
        <VideoPreview poster={posterUrl ?? generatedPoster ?? fallbackPoster} title={title} aspectRatio={aspectRatio} onPlay={() => {
          videoRef.current?.play().catch(() => setPlaying(false))
        }} />
      </div>}
    </div>
  )
}

function LinkedVideoEmbed({ url, embedUrl, title, posterUrl, fallbackPoster }: { url: string; embedUrl: string; title: string; posterUrl?: string; fallbackPoster?: string }) {
  const [dimensions, setDimensions] = useState({ width: 16, height: 9 })
  const [thumbnailUrl, setThumbnailUrl] = useState<string>()
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/video-dimensions?preview=1&url=${encodeURIComponent(url)}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() as Promise<{ width: number; height: number; thumbnailUrl?: string }> : null)
      .then(result => {
        if (result && result.width > 0 && result.height > 0) setDimensions({ width: result.width, height: result.height })
        if (result?.thumbnailUrl) setThumbnailUrl(result.thumbnailUrl)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [url])

  const aspectRatio = `${dimensions.width} / ${dimensions.height}`
  const autoplayUrl = `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`
  return (
    <div style={{ width: '100%', overflow: 'hidden', background: '#000' }}>
      {!playing ? <VideoPreview poster={posterUrl ?? thumbnailUrl ?? fallbackPoster} title={title} aspectRatio={aspectRatio} onPlay={() => setPlaying(true)} /> : (
        <iframe
          src={autoplayUrl}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          width={dimensions.width}
          height={dimensions.height}
          style={{ display: 'block', width: '100%', height: 'auto', aspectRatio, border: 0 }}
        />
      )}
    </div>
  )
}
