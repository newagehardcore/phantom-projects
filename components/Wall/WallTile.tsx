'use client'

import { useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import type { WallProject } from '@/lib/types'

interface WallTileProps {
  project: WallProject
  isHovered: boolean
  onMount: (instanceId: string, el: HTMLDivElement | null) => void
  onKeyActivate: (slug: string) => void
}

const mediaStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  pointerEvents: 'none',
  userSelect: 'none',
}

// Each tile bleeds past its grid cell so sphere-projected rotations never show gaps.
// The z-index in Wall.tsx (center tiles on top) keeps the overlap invisible.
const BLEED = 10

export default function WallTile({ project, isHovered, onMount, onKeyActivate }: WallTileProps) {
  const ref      = useRef<HTMLDivElement>(null)
  const imgRef   = useRef<HTMLImageElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const currentThumbIndex = useRef(0)
  const mediaAnimation = useRef<Animation | null>(null)

  // Keep the CMS order within each media type, with videos leading every cycle.
  const thumbnails = useMemo(() => {
    const media = project.thumbnails?.length
      ? project.thumbnails
      : project.thumbnail ? [project.thumbnail] : []
    return [...media].sort((a, b) =>
      Number('type' in b && b.type === 'video') - Number('type' in a && a.type === 'video')
    )
  }, [project.thumbnails, project.thumbnail])
  const firstThumb   = thumbnails[0] ?? { url: '', alt: '' }
  const firstIsVideo = 'type' in firstThumb && firstThumb.type === 'video'

  // Callback ref fires when React inserts the element, before any autoplay
  // evaluation. Sets muted as a DOM property — the `muted` JSX prop only sets
  // the HTML attribute, not the property browsers check for autoplay permission.
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
    if (!el) return
    el.muted = true
    el.defaultMuted = true
  }, [])

  useLayoutEffect(() => {
    onMount(project.id, ref.current)
    return () => onMount(project.id, null)
  }, [project.id, onMount])

  // ── Thumbnail cycling and hover flash ─────────────────────────────────────
  useEffect(() => {
    const imgs = thumbnails
    const imageElement = imgRef.current
    const imageIndexes = imgs.flatMap((thumb, i) => ('type' in thumb && thumb.type === 'video') ? [] : [i])
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let stopTimer = () => {}

    const stopAnimation = () => {
      mediaAnimation.current?.cancel()
      mediaAnimation.current = null
    }

    const showThumb = (i: number) => {
      if (!imgs.length) return
      stopAnimation()
      currentThumbIndex.current = (i + imgs.length) % imgs.length
      const thumb = imgs[currentThumbIndex.current]
      if ('type' in thumb && thumb.type === 'video') {
        if (imageElement) imageElement.style.display = 'none'
        if (videoRef.current) {
          const v = videoRef.current
          v.style.display = 'block'
          v.src = thumb.url
          v.muted = true
          const onCanPlay = () => v.play().catch(() => {})
          v.addEventListener('canplay', onCanPlay, { once: true })
          v.load()
        }
      } else {
        if (videoRef.current) {
          videoRef.current.pause()
          videoRef.current.removeAttribute('src')
          videoRef.current.load()
          videoRef.current.style.display = 'none'
        }
        if (imageElement) {
          const image = imageElement
          image.style.display = 'block'
          // Image URLs are already cropped with Sanity's saved hotspot.
          image.style.objectPosition = '50% 50%'
          image.alt = thumb.alt
          image.onload = null
          image.src = thumb.url
        }
      }
    }

    if (isHovered) {
      if (imageIndexes.length > 1) {
        const order = [...imageIndexes].sort(() => Math.random() - 0.5)
        showThumb(order[0])
        if (!reducedMotion) {
          let index = 0
          const timer = window.setInterval(() => {
            index = (index + 1) % order.length
            showThumb(order[index])
          }, 100)
          stopTimer = () => window.clearInterval(timer)
        }
      } else if (imageIndexes.length === 1) {
        showThumb(imageIndexes[0])
        const image = imageElement
        if (image && !reducedMotion) {
          mediaAnimation.current = image.animate([{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }], { duration: 100, iterations: Infinity })
        }
      } else {
        showThumb(currentThumbIndex.current)
      }
    } else {
      showThumb(Math.min(currentThumbIndex.current, imgs.length - 1))
      if (imgs.length > 1) {
        const seed = project.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
        const baseMs = 10000 + (seed * 2971 + 13) % 8000
        const schedule = () => {
          const nextMs = -baseMs * Math.log(Math.random() + 1e-10)
          const timer = window.setTimeout(() => {
            const nextIndex = (currentThumbIndex.current + 1) % imgs.length
            showThumb(nextIndex)
            schedule()
          }, nextMs)
          stopTimer = () => window.clearTimeout(timer)
        }
        schedule()
      }
    }

    return () => {
      stopTimer()
      stopAnimation()
      if (imageElement) imageElement.onload = null
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.removeAttribute('src')
        videoRef.current.load()
      }
    }
  }, [project.id, thumbnails, isHovered])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onKeyActivate(project.slug)
      }
    },
    [onKeyActivate, project.slug]
  )

  return (
    <div
      ref={ref}
      data-slug={project.slug}
      data-tile-id={project.id}
      data-base-cx={String(project.x + project.w / 2)}
      data-base-cy={String(project.y + project.h / 2)}
      role="button"
      tabIndex={0}
      aria-label={`Open project: ${project.title}`}
      onKeyDown={onKeyDown}
      style={{
        position: 'absolute',
        left: project.x - BLEED,
        top: project.y - BLEED,
        width: project.w + BLEED * 2,
        height: project.h + BLEED * 2,
        transformOrigin: 'center center',
        overflow: 'hidden',
        cursor: 'pointer',
        background: '#000',
        outline: 'none',
      }}
    >
      {/* Inner div — Wall controls the hover scale */}
      <div style={{ position: 'absolute', inset: 0, transformOrigin: 'center center', willChange: 'transform' }}>
        {!firstThumb.url && (
          <div style={{ ...mediaStyle, display: 'grid', placeItems: 'center', padding: 36, boxSizing: 'border-box', color: '#fff', fontSize: 28, textAlign: 'center' }}>
            {project.title}
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={firstIsVideo ? undefined : firstThumb.url || undefined}
          alt={firstThumb.alt}
          loading="lazy"
          draggable={false}
          style={{ ...mediaStyle, display: firstIsVideo || !firstThumb.url ? 'none' : 'block' }}
        />
        <video
          ref={setVideoRef}
          src={firstIsVideo ? firstThumb.url : undefined}
          preload={firstIsVideo ? 'auto' : 'none'}
          loop
          playsInline
          onCanPlay={firstIsVideo ? (e) => { (e.currentTarget as HTMLVideoElement).play().catch(() => {}) } : undefined}
          style={{ ...mediaStyle, display: firstIsVideo ? 'block' : 'none' }}
        />
      </div>
    </div>
  )
}
