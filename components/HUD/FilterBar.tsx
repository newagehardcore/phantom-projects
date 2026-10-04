'use client'

import { useRef, useEffect, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { FILTER_OPTIONS } from '@/lib/types'
import type { FilterType } from '@/lib/types'

interface FilterBarProps {
  active: FilterType
  onChange: (f: FilterType) => void
}

export default function FilterBar({ active, onChange }: FilterBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const initialized = useRef(false)

  function moveHighlight(btn: HTMLButtonElement | null, animate: boolean) {
    if (!btn || !highlightRef.current || !containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const left = btnRect.left - containerRect.left
    const width = btnRect.width

    if (!animate || !initialized.current) {
      gsap.set(highlightRef.current, { left, width })
      initialized.current = true
    } else {
      gsap.to(highlightRef.current, { left, width, duration: 0.25, ease: 'power2.out' })
    }
  }

  useEffect(() => {
    const idx = FILTER_OPTIONS.indexOf(active)
    moveHighlight(btnRefs.current[idx] ?? null, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  useLayoutEffect(() => {
    const update = () => {
      const idx = FILTER_OPTIONS.indexOf(active)
      moveHighlight(btnRefs.current[idx] ?? null, false)
    }
    update()
    const observer = new ResizeObserver(update)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [active])

  return (
    <div className="wall-filters" role="group" aria-label="Filter projects" ref={containerRef} style={{ position: 'relative', display: 'flex', gap: 0 }}>
      <div
        className="filter-highlight"
        ref={highlightRef}
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          background: '#fff',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {FILTER_OPTIONS.map((f, i) => (
        <button
          key={f}
          ref={(el) => { btnRefs.current[i] = el }}
          onClick={() => onChange(f)}
          className="filter-btn"
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '7px 16px',
            border: 'none',
            borderRadius: 0,
            background: 'transparent',
            color: active === f ? '#000' : '#fff',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          aria-pressed={active === f}
        >
          {f}
        </button>
      ))}
    </div>
  )
}
