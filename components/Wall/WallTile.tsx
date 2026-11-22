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

export default function WallTile({ project, isHovered, onMount, onKeyActivate }: WallTileProps) {
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
    const imageIndexes = imgs.flatMap((thumb, i) => ('type' in thumb && thumb.type === 'video') ? [] : [i])
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let active = true
    let animation: Animation | undefined
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

    const flash = (element: HTMLElement | null) => {
      animation?.cancel()
      animation = element?.animate([{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }], { duration: 100, iterations: Infinity })
    }

    if (isHovered && !reducedMotion) {
      // Keep showing the current media while the hover images are loading.
      const thumb = imgs[currentThumbIndex.current]
      flash(thumb && 'type' in thumb && thumb.type === 'video' ? videoElement : imageElement)
      const ready: number[] = []
      for (const i of imageIndexes) {
        const image = new Image()
        image.src = imgs[i].url
        void image.decode().then(() => {
          if (!active) return
          ready.push(i)
          if (ready.length === 1) {
            showThumb(i)
            flash(imageElement)
          } else if (ready.length === 2) {
            animation?.cancel()
            let index = 0
            const timer = window.setInterval(() => {
              index = (index + 1) % ready.length
              showThumb(ready[index])
            }, 100)
            stopTimer = () => window.clearInterval(timer)
          }
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
      animation?.cancel()
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
