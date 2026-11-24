'use client'

import { useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import type { WallProject } from '@/lib/types'

interface WallTileProps {
  project: WallProject
  isHovered: boolean
  warmHoverFrames: boolean
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
const hoverFrames = new Map<string, { pending: HTMLImageElement | null; decoded: Promise<void> }>()

function loadHoverFrame(url: string, priority: 'auto' | 'high') {
  const cached = hoverFrames.get(url)
  if (cached) {
    if (cached.pending && priority === 'high') cached.pending.fetchPriority = priority
    return cached.decoded
  }

  const image = new Image()
  image.fetchPriority = priority
  image.src = url
  const frame = {
    pending: image as HTMLImageElement | null,
    decoded: image.decode().then(() => { frame.pending = null }, error => {
      hoverFrames.delete(url)
      throw error
    }),
  }
  hoverFrames.set(url, frame)
  return frame.decoded
}

function thumbnailPriority(thumb: WallProject['thumbnails'][number]) {
  if (thumb.type === 'video') return 2
  return thumb.type === 'videoPoster' ? 1 : 0
}

function hashInstanceId(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export default function WallTile({ project, isHovered, warmHoverFrames, onMount, onKeyActivate }: WallTileProps) {
  const ref      = useRef<HTMLDivElement>(null)
  const imgRef   = useRef<HTMLImageElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isInView = useRef(false)

  // Keep CMS order within each type and start on video media whenever available.
  const thumbnails = useMemo(() => {
    const media = project.thumbnails?.length
      ? project.thumbnails
      : project.thumbnail ? [project.thumbnail] : []
    const seen = new Set<string>()
    return media.filter(thumb => {
      if (!thumb.url || seen.has(thumb.url)) return false
      seen.add(thumb.url)
      return true
    }).sort((a, b) => thumbnailPriority(b) - thumbnailPriority(a))
  }, [project.thumbnails, project.thumbnail])
  const instanceSeed = useMemo(() => hashInstanceId(project.id), [project.id])
  const startingThumbs = thumbnails.filter(thumb => thumbnailPriority(thumb) === thumbnailPriority(thumbnails[0]))
  const initialThumbIndex = startingThumbs.length ? instanceSeed % startingThumbs.length : 0
  const cycleStep = instanceSeed % 2 === 0 ? 1 : -1
  const currentThumbIndex = useRef(initialThumbIndex)
  const firstThumb   = thumbnails[initialThumbIndex] ?? { url: '', alt: '' }
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

  useEffect(() => {
    const tile = ref.current
    if (!warmHoverFrames || !tile || thumbnails.length < 2 || !window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const cover = imgRef.current
      for (const thumb of thumbnails) {
        if (thumbnailPriority(thumb) === 2 || thumb.url === cover?.getAttribute('src')) continue
        void loadHoverFrame(thumb.url, 'auto').catch(() => {})
      }
    })
    observer.observe(tile)
    return () => observer.disconnect()
  }, [thumbnails, warmHoverFrames])

  useEffect(() => {
    const video = videoRef.current
    const tile = ref.current
    if (!video || !tile || !thumbnails.some(thumb => thumbnailPriority(thumb) === 2)) return
    const observer = new IntersectionObserver(([entry]) => {
      isInView.current = entry.isIntersecting
      if (!entry.isIntersecting) {
        video.pause()
      } else if (video.hasAttribute('src') && video.style.display !== 'none' && video.paused) {
        void video.play().catch(() => {})
      }
    })
    observer.observe(tile)
    return () => {
      observer.disconnect()
      isInView.current = false
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [thumbnails])

  // ── Thumbnail cycling and hover flash ─────────────────────────────────────
  useEffect(() => {
    const imgs = thumbnails
    const imageElement = imgRef.current
    const videoElement = videoRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let active = true
    let stopTimer = () => {}

    const showThumb = (i: number) => {
      const thumb = imgs[i]
      if (!thumb) return
      if ('type' in thumb && thumb.type === 'video') {
        if (imageElement) imageElement.style.display = 'none'
        if (videoElement) {
          const v = videoElement
          v.style.display = 'block'
          if (v.getAttribute('src') !== thumb.url) {
            v.poster = thumb.posterUrl ?? ''
            v.src = thumb.url
          }
          v.muted = true
          if (isInView.current && v.paused) void v.play().catch(() => {})
        }
      } else {
        if (videoElement) {
          if (videoElement.hasAttribute('src')) {
            videoElement.pause()
            videoElement.removeAttribute('src')
            videoElement.load()
          }
          videoElement.style.display = 'none'
        }
        if (imageElement) {
          const image = imageElement
          image.style.display = 'block'
          // Image URLs are already cropped with Sanity's saved hotspot.
          image.style.objectPosition = '50% 50%'
          image.alt = thumb.alt
          if (image.getAttribute('src') !== thumb.url) image.src = thumb.url
        }
      }
    }

    if (isHovered && !reducedMotion) {
      const visibleImage = imageElement?.complete && imageElement.naturalWidth && imageElement.style.display !== 'none'
        ? imageElement.getAttribute('src')
        : null
      const current = imgs.findIndex(thumb => thumb.url === visibleImage)
      const ready = current < 0 ? [] : [current]
      const imageIndexes = imgs.flatMap((thumb, i) => {
        if (i === current || thumbnailPriority(thumb) === 2) return []
        if (hoverFrames.get(thumb.url)?.pending !== null) return [i]
        ready.push(i)
        return []
      })

      function startCycle() {
        let index = 1
        showThumb(ready[index])
        const timer = window.setInterval(() => {
          index = (index + 1) % ready.length
          showThumb(ready[index])
        }, 100)
        stopTimer = () => window.clearInterval(timer)
      }

      if (ready.length > 1) startCycle()
      else if (ready.length === 1 && current < 0) showThumb(ready[0])

      for (const i of imageIndexes) {
        void loadHoverFrame(imgs[i].url, 'high').then(() => {
          if (!active) return
          ready.push(i)
          if (ready.length === 1) showThumb(i)
          else if (ready.length === 2) startCycle()
        }).catch(() => {})
      }
    } else if (!isHovered) {
      currentThumbIndex.current = Math.min(currentThumbIndex.current, Math.max(0, imgs.length - 1))
      showThumb(currentThumbIndex.current)
      if (imgs.length > 1) {
        const baseMs = 10000 + (instanceSeed * 2971 + 13) % 8000
        const schedule = () => {
          const nextMs = -baseMs * Math.log(Math.random() + 1e-10)
          const timer = window.setTimeout(() => {
            currentThumbIndex.current = (currentThumbIndex.current + cycleStep + imgs.length) % imgs.length
            showThumb(currentThumbIndex.current)
            schedule()
          }, nextMs)
          stopTimer = () => window.clearTimeout(timer)
        }
        schedule()
      }
    }

    return () => {
      active = false
      stopTimer()
    }
  }, [project.id, thumbnails, isHovered, instanceSeed, cycleStep])

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
          poster={firstIsVideo ? firstThumb.posterUrl : undefined}
          preload="none"
          loop
          playsInline
          style={{ ...mediaStyle, display: firstIsVideo ? 'block' : 'none' }}
        />
        <div className={`mobile-tile-title${isHovered ? ' is-visible' : ''}`}>
          {project.title}
        </div>
      </div>
    </div>
  )
}
