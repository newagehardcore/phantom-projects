'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import type { WallProject } from '@/lib/types'

interface ReadoutProps {
  project: WallProject | null
}

export default function Readout({ project }: ReadoutProps) {
  const ref = useRef<HTMLDivElement>(null)
  const anim = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    const moveReadout = (event: MouseEvent) => {
      const el = ref.current
      if (!el) return

      const margin = 16
      const gap = 20
      const bounds = el.getBoundingClientRect()
      const left = event.clientX + gap + bounds.width > window.innerWidth - margin
        ? event.clientX - bounds.width - gap
        : event.clientX + gap
      const top = event.clientY + gap + bounds.height > window.innerHeight - margin
        ? event.clientY - bounds.height - gap
        : event.clientY + gap

      el.style.left = `${Math.max(margin, left)}px`
      el.style.top = `${Math.max(margin, top)}px`
    }

    window.addEventListener('mousemove', moveReadout, { passive: true })
    return () => window.removeEventListener('mousemove', moveReadout)
  }, [])

  useEffect(() => {
    if (!ref.current) return
    anim.current?.kill()
    if (project) {
      anim.current = gsap.to(ref.current, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'power2.out' })
    } else {
      anim.current = gsap.to(ref.current, { autoAlpha: 0, y: 4, duration: 0.15, ease: 'power2.in' })
    }
  }, [project])

  return (
    <div
      ref={ref}
      className="wall-readout"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 20,
        maxWidth: 'min(420px, calc(100vw - 32px))',
        pointerEvents: 'none',
        opacity: 0,
        visibility: 'hidden',
      }}
    >
      <div style={{ fontSize: 25, fontWeight: 700, color: '#fff', letterSpacing: '-0.035em', lineHeight: 1.08 }}>
        {project?.title}
      </div>
      {project?.subtitleName && (
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', letterSpacing: '-0.01em', lineHeight: 1.3, marginTop: 5 }}>
          {project.subtitleType && project.subtitleType !== 'None' && <>{project.subtitleType}{' '}</>}
          {project.subtitleType === 'None' ? `“${project.subtitleName}”` : project.subtitleName}
        </div>
      )}
    </div>
  )
}
