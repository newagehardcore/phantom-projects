'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import MediaReel from './MediaReel'
import MediaItem from './MediaItem'
import type { WallProject, LinkedItem } from '@/lib/types'
import type { FilterType } from '@/lib/types'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatProjectDate(date: string) {
  const stored = date.trim().match(/^(\d{4})-(0[1-9]|1[0-2])$/)
  if (stored) return `${MONTH_NAMES[Number(stored[2]) - 1]} ${stored[1]}`
  const legacy = date.trim().match(/^(0?[1-9]|1[0-2])-(\d{4})$/)
  if (legacy) return `${MONTH_NAMES[Number(legacy[1]) - 1]} ${legacy[2]}`
  return date
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
  const scrimRef    = useRef<HTMLDivElement>(null)
  const modalRef    = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobileViewport = () => window.matchMedia('(max-width: 640px), (hover: none)').matches

  const close = useCallback(() => {
    if (prefersReducedMotion || isMobileViewport()) { onClose(); return }
    gsap.to(modalRef.current, { autoAlpha: 0, scale: 0.96, duration: 0.2, ease: 'power2.in' })
    gsap.to(scrimRef.current, { autoAlpha: 0, duration: 0.2, onComplete: onClose })
  }, [onClose, prefersReducedMotion])

  useEffect(() => {
    if (!prefersReducedMotion && !isMobileViewport()) {
      gsap.fromTo(scrimRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
      gsap.fromTo(modalRef.current,
        { autoAlpha: 0, scale: 0.96 },
        { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
      )
    }
    closeBtnRef.current?.focus()
  }, [prefersReducedMotion])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') onPrevious?.()
      if (e.key === 'ArrowRight') onNext?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, onPrevious, onNext])

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
  }, [])

  return (
    <>
      {/* Scrim — semi-transparent so the wall is visible behind */}
      <div
        ref={scrimRef}
        className="project-modal-scrim"
        onClick={close}
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.15)',
          zIndex: 20,
          visibility: prefersReducedMotion ? 'visible' : 'hidden',
        }}
      />

      {/* Centering shell — pointer-events none so clicks outside card hit scrim */}
      <div
        className="project-modal-shell"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 21,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          padding: '24px',
        }}
      >
        {/* Modal frame — controls sit over its outside edges */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal
          aria-label={`Project: ${project.title}`}
          className="project-modal-frame"
          style={{
            width: 'min(1100px, 100%)',
            height: 'min(700px, 88vh)',
            position: 'relative',
            pointerEvents: 'none',
            visibility: prefersReducedMotion ? 'visible' : 'hidden',
          }}
        >
          <button ref={closeBtnRef} type="button" onClick={close} aria-label="Close project" className="modal-edge-control modal-close-control">×</button>
          <button type="button" onClick={onPrevious} disabled={!onPrevious} aria-label="Previous project by date" className="modal-edge-control modal-previous-control">{'<'}</button>
          <button type="button" onClick={onNext} disabled={!onNext} aria-label="Next project by date" className="modal-edge-control modal-next-control">{'>'}</button>

          <div
            className="project-modal-card"
            style={{
              width: '100%',
              height: '100%',
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              overflow: 'hidden',
              pointerEvents: 'auto',
            }}
          >
            {(project.videos ?? [])[0] && (
              <div className="mobile-featured-video">
                <MediaItem kind="video" data={project.videos[0]} />
              </div>
            )}

            {/* Left: info */}
            <div
              className="modal-info"
              style={{
                width: '38%',
                flexShrink: 0,
                padding: '36px 32px',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >

            {/* Title */}
            <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 32px)', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              {project.title}
            </h2>

            {/* Subtitle credit line: "By Camille Henrot", "El Boca Quedó", etc. */}
            {project.subtitleName && (
              <p style={{ margin: '10px 0 0', fontSize: 'clamp(13px, 1.2vw, 16px)', color: '#fff', letterSpacing: '-0.01em', fontWeight: 500, lineHeight: 1.2 }}>
                {project.subtitleType && project.subtitleType !== 'None' && <>{project.subtitleType}{' '}</>}
                {project.subtitleUrl ? (
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
              </p>
            )}

            {/* Meta grid */}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {project.date && <Meta label="Date" value={formatProjectDate(project.date)} />}
              <MetaFilter label="Type" items={project.type} onSelect={type => onFilter(type as FilterType)} />
              {project.roles && project.roles.length > 0 && (
                <MetaFilter label="Role" items={project.roles} onSelect={role => onFilter({ role })} />
              )}
              {project.collaborators && project.collaborators.length > 0 && (
                <MetaLinks label="With" items={project.collaborators} />
              )}
              {project.presentedAt && project.presentedAt.length > 0 && (
                <MetaLinks label="At" items={project.presentedAt} />
              )}
              {project.watchOn && project.watchOn.length > 0 && (
                <MetaLinks label="Watch" items={project.watchOn} />
              )}
              {project.press && project.press.length > 0 && (
                <MetaLinks label="Press" items={project.press} />
              )}
            </div>

            {/* Description */}
            {project.description && (
              <p style={{ marginTop: 24, width: '100%', fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.65)', whiteSpace: 'pre-line', textAlign: 'justify' }}>
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
            <div className="modal-media" style={{ flex: 1, padding: '36px 32px', overflowY: 'auto' }}>
              <MediaReel project={project} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
      <span style={{ color: 'rgba(255,255,255,0.38)', width: 52, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.85)' }}>{value}</span>
    </div>
  )
}

function MetaFilter({ label, items, onSelect }: { label: string; items: string[]; onSelect: (value: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
      <span style={{ color: 'rgba(255,255,255,0.38)', width: 52, flexShrink: 0 }}>{label}</span>
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: '0 6px' }}>
        {items.map((item, i) => (
          <span key={item}>
            <button type="button" onClick={() => onSelect(item)}
              style={{ padding: 0, border: 0, background: 'none', color: 'rgba(255,255,255,0.85)', font: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
            >{item}</button>{i < items.length - 1 ? (label === 'Type' ? ' / ' : ', ') : ''}
          </span>
        ))}
      </span>
    </div>
  )
}

function MetaLinks({ label, items }: { label: string; items: LinkedItem[] }) {
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
      <span style={{ color: 'rgba(255,255,255,0.38)', width: 52, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.35 }}>
        {items.map((item, i) => (
          <span key={`${item.name}-${item.url ?? ''}-${i}`}>
            {item.url ? (
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'inherit')}
              >
                {item.name}
              </a>
            ) : item.name}
            {i < items.length - 1 ? ', ' : ''}
          </span>
        ))}
      </span>
    </div>
  )
}
