'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
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

  useEffect(() => {
    if (overlayRef.current) {
      gsap.fromTo(overlayRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
    }
  }, [])

  const close = useCallback(() => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.15, onComplete: onClose })
    } else {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft' && index > 0) onNav(index - 1)
      if (e.key === 'ArrowRight' && index < photos.length - 1) onNav(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, index, photos.length, onNav])

  if (!photo) return null

  return (
    <div
      ref={overlayRef}
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.95)',
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
          onClick={(e) => { e.stopPropagation(); onNav(index - 1) }}
          aria-label="Previous image"
          style={navBtnStyle('left')}
        >
          ←
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
          onClick={(e) => { e.stopPropagation(); onNav(index + 1) }}
          aria-label="Next image"
          style={navBtnStyle('right')}
        >
          →
        </button>
      )}

      {/* Close */}
      <button
        onClick={close}
        aria-label="Close lightbox"
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff',
          borderRadius: '50%',
          width: 36,
          height: 36,
          cursor: 'pointer',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ×
      </button>
    </div>
  )
}

function navBtnStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    [side]: 20,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff',
    borderRadius: '50%',
    width: 40,
    height: 40,
    cursor: 'pointer',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}
