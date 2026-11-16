'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { createPortal } from 'react-dom'
import ModalIcon from './ModalIcon'
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
        const controls = e.currentTarget.querySelectorAll<HTMLButtonElement>('button')
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        visibility: 'hidden',
      }}
      aria-modal
      role="dialog"
      aria-label="Image lightbox"
    >
      {/* Prev */}
      {index > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNav(index - 1) }}
          aria-label="Previous image"
          className="modal-edge-control lightbox-previous"
        >
          <ModalIcon icon="previous" />
        </button>
      )}

      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={photo.alt ?? ''}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          objectFit: 'contain',
          display: 'block',
        }}
      />

      {/* Next */}
      {index < photos.length - 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNav(index + 1) }}
          aria-label="Next image"
          className="modal-edge-control lightbox-next"
        >
          <ModalIcon icon="next" />
        </button>
      )}

      {/* Close */}
      <button
        type="button"
        onClick={close}
        aria-label="Close lightbox"
        ref={closeBtnRef}
        className="modal-edge-control modal-close-control lightbox-close"
      >
        <ModalIcon icon="close" />
      </button>
    </div>,
    document.body
  )
}
