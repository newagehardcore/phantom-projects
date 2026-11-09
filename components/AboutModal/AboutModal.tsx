'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import type { About } from '@/lib/types'

interface AboutModalProps {
  about: About
  onClose: () => void
}

export default function AboutModal({ about, onClose }: AboutModalProps) {
  const socials = [
    ...(about.contactEmail ? [{ label: 'Email', url: `mailto:${about.contactEmail}` }] : []),
    ...(about.socials ?? []),
  ]
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
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!prefersReducedMotion) {
      gsap.fromTo(scrimRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
      gsap.fromTo(cardRef.current,
        { autoAlpha: 0, scale: 0.96 },
        { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power2.out', onComplete: () => { closeBtnRef.current?.focus() } }
      )
    } else {
      closeBtnRef.current?.focus()
    }
    return () => { if (opener?.isConnected) opener.focus() }
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
        className="about-modal-scrim"
        ref={scrimRef}
        onClick={close}
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.52)',
          backdropFilter: 'blur(12px)',
          zIndex: 20,
          visibility: prefersReducedMotion ? 'visible' : 'hidden',
        }}
      />

      {/* Centering shell */}
      <div
        className="about-modal-shell"
      >
        {/* Card */}
        <div
          ref={cardRef}
          role="dialog"
          aria-modal
          aria-label="About Phantom Projects"
          className="about-modal-card" style={{ visibility: prefersReducedMotion ? 'visible' : 'hidden' }}
        >
          <button ref={closeBtnRef} type="button" onClick={close} aria-label="Close about" className="modal-edge-control about-close-control">×</button>
          <div className="about-modal-body">

          {/* Left: bio + socials */}
          <div className="about-modal-copy">
            {about.headerDescription && (
              <h2 className="about-modal-heading">
                {about.headerDescription}
              </h2>
            )}

            {about.bio && (
              <p className="modal-description">
                {about.bio}
              </p>
            )}

            {socials.length > 0 && (
              <div className="about-socials" style={{ marginTop: 28 }}>
                {socials.map((s, i) => (
                  <span key={`${s.label}-${s.url}-${i}`}>
                    <a
                      href={s.url}
                      target={s.url.startsWith('mailto:') ? undefined : '_blank'}
                      rel={s.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                    >
                      {s.label}
                    </a>
                    <span aria-hidden="true"> ↗</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: photo */}
          {about.photo && (
            <div className="about-modal-image">
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
      </div>
    </>
  )
}
