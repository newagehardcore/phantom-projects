'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { createPortal } from 'react-dom'
import ModalToolbar from './ModalToolbar'
import type { PhotoAsset } from '@/lib/types'

interface LightboxProps {
  photos: PhotoAsset[]
  index: number
  onClose: () => void
  onNav: (next: number) => void
}

export default function Lightbox({ photos, index, onClose, onNav }: LightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const photo = photos[index]
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    gsap.fromTo(overlayRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: reducedMotion ? 0 : 0.2, onComplete: () => { closeBtnRef.current?.focus() } })
    return () => { if (opener?.isConnected) opener.focus() }
  }, [reducedMotion])

  const close = useCallback(() => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, { autoAlpha: 0, duration: reducedMotion ? 0 : 0.15, onComplete: onClose })
    } else {
      onClose()
    }
  }, [onClose, reducedMotion])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft' && index > 0) onNav(index - 1)
      if (e.key === 'ArrowRight' && index < photos.length - 1) onNav(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, index, photos.length, onNav])

  if (!photo || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={overlayRef}
      className="project-media-lightbox"
      onKeyDown={(e) => {
        if (e.key !== 'Tab') return
        e.stopPropagation()
        const controls = e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
      style={{ visibility: 'hidden' }}
      aria-modal
      role="dialog"
      aria-label="Image lightbox"
    >
      <div className="lightbox-panel">
        <ModalToolbar
          closeRef={closeBtnRef}
          closeLabel="Close lightbox"
          navigationLabel="Image navigation"
          previousLabel="Previous image"
          nextLabel="Next image"
          onClose={close}
          onPrevious={index > 0 ? () => onNav(index - 1) : undefined}
          onNext={index < photos.length - 1 ? () => onNav(index + 1) : undefined}
        />
        <div className="lightbox-image-stage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={photo.alt ?? ''} />
        </div>
      </div>
    </div>,
    document.body
  )
}
