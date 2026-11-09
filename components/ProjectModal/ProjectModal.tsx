'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import MediaReel from './MediaReel'
import MediaItem from './MediaItem'
import type { WallProject, LinkedItem } from '@/lib/types'
import type { FilterType } from '@/lib/types'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatProjectDate(date: string) {
  const stored = date.trim().match(/^(\d{4})-(0[1-9]|1[0-2])$/)
  if (stored) return `${MONTH_NAMES[Number(stored[2]) - 1]} ’${stored[1].slice(-2)}`
  const legacy = date.trim().match(/^(0?[1-9]|1[0-2])-(\d{4})$/)
  if (legacy) return `${MONTH_NAMES[Number(legacy[1]) - 1]} ’${legacy[2].slice(-2)}`
  return date.trim()
}

interface ProjectModalProps {
  project: WallProject
  onClose: () => void
  onFilter: (filter: FilterType | { role: string }) => void
  onPrevious?: () => void
  onNext?: () => void
}

export default function ProjectModal({ project, onClose, onFilter, onPrevious, onNext }: ProjectModalProps) {
  const subtitle = project.subtitleType === 'None' && project.subtitleName
    ? `“${project.subtitleName}”`
    : project.subtitleName
  const date = project.date ? formatProjectDate(project.date) : ''
  const scrimRef    = useRef<HTMLDivElement>(null)
  const modalRef    = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobileViewport = () => window.matchMedia('(max-width: 800px), (hover: none)').matches

  const close = useCallback(() => {
    if (prefersReducedMotion || isMobileViewport()) { onClose(); return }
    gsap.to(modalRef.current, { autoAlpha: 0, scale: 0.96, duration: 0.2, ease: 'power2.in' })
    gsap.to(scrimRef.current, { autoAlpha: 0, duration: 0.2, onComplete: onClose })
  }, [onClose, prefersReducedMotion])

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!prefersReducedMotion && !isMobileViewport()) {
      gsap.fromTo(scrimRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
      gsap.fromTo(modalRef.current,
        { autoAlpha: 0, scale: 0.96 },
        { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power2.out', onComplete: () => { closeBtnRef.current?.focus() } }
      )
    } else {
      gsap.set([scrimRef.current, modalRef.current], { autoAlpha: 1 })
      closeBtnRef.current?.focus()
    }
    return () => { if (opener?.isConnected) opener.focus() }
  }, [prefersReducedMotion])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[aria-label="Image lightbox"]')) return
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') onPrevious?.()
      if (e.key === 'ArrowRight') onNext?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, onPrevious, onNext])

  useEffect(() => {
    modalRef.current?.querySelectorAll('.project-modal-card, .modal-info, .modal-media').forEach(panel => panel.scrollTo(0, 0))
  }, [project.id])

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input, select, textarea, iframe, video[controls], audio[controls], [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last  = focusable[focusable.length - 1]
    const trap  = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus() }
      }
    }
    modal.addEventListener('keydown', trap)
    return () => modal.removeEventListener('keydown', trap)
  }, [project])

  return (
    <>
      {/* Scrim — semi-transparent so the wall is visible behind */}
      <div
        ref={scrimRef}
        className="project-modal-scrim"
        onClick={close}
        aria-hidden
        style={{ visibility: prefersReducedMotion ? 'visible' : 'hidden' }}
      />

      {/* Centering shell — pointer-events none so clicks outside card hit scrim */}
      <div
        className="project-modal-shell"
      >
        {/* Frame keeps the toolbar visible while content scrolls. */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal
          aria-label={`Project: ${project.title}`}
          className="project-modal-frame" style={{ visibility: prefersReducedMotion ? 'visible' : 'hidden' }}
        >
          <button ref={closeBtnRef} type="button" onClick={close} aria-label="Close project" className="modal-edge-control modal-close-control">×</button>
          <button type="button" onClick={onPrevious} disabled={!onPrevious} aria-label="Previous project by date" className="modal-edge-control modal-previous-control">{'<'}</button>
          <button type="button" onClick={onNext} disabled={!onNext} aria-label="Next project by date" className="modal-edge-control modal-next-control">{'>'}</button>

          <div
            className="project-modal-card"
          >
            {(project.videos ?? [])[0] && (
              <div className="mobile-featured-video">
                <MediaItem kind="video" data={project.videos[0]} fallbackPoster={project.photos[0]?.url ?? project.thumbnail?.url} />
              </div>
            )}

            {/* Left: info */}
            <div
              className="modal-info"
            >

            {/* Title */}
            <h2 className="project-modal-title">
              {project.title}
            </h2>

            {/* Subtitle credit line: "By Camille Henrot", "El Boca Quedó", etc. */}
            {(subtitle || date) && (
              <p className="modal-subtitle">
                {subtitle && project.subtitleType && project.subtitleType !== 'None' && <>{project.subtitleType}{' '}</>}
                {subtitle && project.subtitleUrl ? (
                  <a
                    href={project.subtitleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    {subtitle}
                  </a>
                ) : subtitle}
                {date && <>{subtitle && ', '}<span className="modal-credit-date">{date}</span></>}
              </p>
            )}

            <dl className="modal-metadata">
              {!!project.collaborators?.length && <MetaLinks label="With" items={project.collaborators} />}
              {!!project.roles?.length && <MetaFilter label="Role" items={project.roles} onSelect={role => onFilter({ role })} />}
              {!!project.presentedAt?.length && <MetaLinks label="At" items={project.presentedAt} />}
              {!!project.press?.length && <MetaLinks label="Press" items={project.press} />}
              {!!project.watchOn?.length && <MetaLinks label="Watch" items={project.watchOn} />}
              {!!project.type.length && <MetaFilter label="Type" items={project.type} onSelect={type => onFilter(type as FilterType)} />}
            </dl>

            {/* Description */}
            {project.description && (
              <p className="modal-description">
                {project.description}
              </p>
            )}

            {(project.links ?? []).length > 0 && (
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(project.links ?? []).map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: '#fff', textDecoration: 'underline', textUnderlineOffset: 2 }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
            </div>

            {/* Right: media */}
            <div className="modal-media">
              <MediaReel key={project.id} project={project} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function MetaFilter({ label, items, onSelect }: { label: string; items: string[]; onSelect: (value: string) => void }) {
  return (
    <div className="modal-meta-row">
      <dt>{label}</dt>
      <dd>{items.map((item, i) => (
        <span key={item}>
          {i > 0 && <span className="modal-meta-separator"> / </span>}
          <button type="button" onClick={() => onSelect(item)}>{item}</button>
        </span>
      ))}</dd>
    </div>
  )
}

function MetaLinks({ label, items }: { label: string; items: LinkedItem[] }) {
  return (
    <div className="modal-meta-row">
      <dt>{label}</dt>
      <dd>{items.map((item, i) => (
        <span key={`${item.name}-${item.url ?? ''}-${i}`}>
          {i > 0 && <span className="modal-meta-separator"> / </span>}
          {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a> : item.name}
        </span>
      ))}</dd>
    </div>
  )
}
