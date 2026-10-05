'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import type { About } from '@/lib/types'

interface AboutModalProps {
  about: About
  onClose: () => void
}

export default function AboutModal({ about, onClose }: AboutModalProps) {
  const socials = about.socials ?? []
  const scrimRef    = useRef<HTMLDivElement>(null)
  const cardRef     = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const close = useCallback(() => {
    if (prefersReducedMotion) { onClose(); return }
    gsap.to(cardRef.current,  { autoAlpha: 0, scale: 0.96, duration: 0.2, ease: 'power2.in' })
    gsap.to(scrimRef.current, { autoAlpha: 0, duration: 0.2, onComplete: onClose })
  }, [onClose, prefersReducedMotion])

  useEffect(() => {
    if (!prefersReducedMotion) {
      gsap.fromTo(scrimRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
      gsap.fromTo(cardRef.current,
        { autoAlpha: 0, scale: 0.96 },
        { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
      )
    }
    closeBtnRef.current?.focus()
  }, [prefersReducedMotion])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  // Focus trap
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const focusable = card.querySelectorAll<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])'
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
    card.addEventListener('keydown', trap)
    return () => card.removeEventListener('keydown', trap)
  }, [])

  return (
    <>
      {/* Scrim */}
      <div
        ref={scrimRef}
        onClick={close}
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.72)',
          zIndex: 20,
          visibility: prefersReducedMotion ? 'visible' : 'hidden',
        }}
      />

      {/* Centering shell */}
      <div
        className="about-modal-shell"
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
        {/* Card */}
        <div
          ref={cardRef}
          role="dialog"
          aria-modal
          aria-label="About Phantom Projects"
          className="about-modal-card"
          style={{
            width: 'min(800px, 100%)',
            position: 'relative',
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            overflow: 'hidden',
            pointerEvents: 'auto',
            visibility: prefersReducedMotion ? 'visible' : 'hidden',
          }}
        >
          <button
            ref={closeBtnRef}
            type="button"
            onClick={close}
            aria-label="Close about"
            className="modal-edge-control about-close-control"
          >
            ×
          </button>

          {/* Left: bio + socials */}
          <div className="about-modal-copy" style={{ flex: 1, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {about.bio && (
              <p style={{ marginTop: 20, fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.65)', maxWidth: 380, whiteSpace: 'pre-line', textAlign: 'justify' }}>
                {about.bio}
              </p>
            )}

            {socials.length > 0 && (
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 12,
                      color: '#fff',
                      textDecoration: 'underline',
                      textUnderlineOffset: 2,
                    }}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Right: photo */}
          {about.photo && (
            <div className="about-modal-image" style={{ width: '52%', flexShrink: 0, position: 'relative', overflow: 'hidden', minHeight: 320 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={about.photo.url}
                alt={about.photo.alt ?? 'Phantom Projects'}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
