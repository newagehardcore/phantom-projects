'use client'

import { useRef, useEffect, useLayoutEffect, useCallback, useState } from 'react'
import gsap from 'gsap'
import WallTile from './WallTile'
import Vignette from './Vignette'
import { projectTile, initialCam, worldSize, H_COPIES, V_COPIES } from '@/lib/wallUtils'
import type { WallProject } from '@/lib/types'

interface WallProps {
  projects: WallProject[]
  isModalOpen: boolean
  onTileClick: (slug: string) => void
  onTileHover: (project: WallProject | null) => void
}

const TAP_MAX_DIST = 8
const TAP_MAX_MS   = 350
const INITIAL_ZOOM = 0.72

// Maximum screen-pixel distance a tile will slide from during the rearrange
const MAX_SLIDE_PX = 700

export default function Wall({
  projects, isModalOpen, onTileClick, onTileHover,
}: WallProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)

  const cam        = useRef({ x: 0, y: 0, z: INITIAL_ZOOM })
  const vel        = useRef({ x: 0, y: 0 })
  const worldBound = useRef({ w: 0, h: 0 })
  const singleSize = useRef({ w: 0, h: 0 })
  const firstMount = useRef(true)

  const isModalOpenRef = useRef(false)
  useEffect(() => { isModalOpenRef.current = isModalOpen }, [isModalOpen])

  const dragActive   = useRef(false)
  const tapStart     = useRef({ x: 0, y: 0, t: 0 })
  const prevPointer  = useRef({ x: 0, y: 0, t: 0 })
  const momentumTw   = useRef<gsap.core.Tween | null>(null)

  const tileEls     = useRef<Map<string, HTMLDivElement>>(new Map())

  // ── Rearrange transition ──────────────────────────────────────────────────
  // displayedProjects lags behind the prop so we can snapshot old tile positions
  // before React swaps the tile elements.
  const [displayedProjects, setDisplayedProjects] = useState<WallProject[]>(projects)
  const pendingProjects  = useRef<WallProject[]>(projects)
  // StrictMode-safe change guards (same-reference → no-op second invocation)
  const displayedRef     = useRef<WallProject[]>(projects)
  const prevDisplayedRef = useRef<WallProject[]>(projects)
  // Per-tile screen-pixel offset (decays to 0 in the RAF each frame)
  const posOffset   = useRef<Map<string, { x: number; y: number }>>(new Map())
  // Old tile screen-center positions captured just before the layout swap
  const oldScreenPos = useRef<Map<string, { cx: number; cy: number }>>(new Map())

  // Tilt system — cursor drives the globe "peak" direction
  const tilt        = useRef({ x: 0, y: 0 })
  const cursor      = useRef<{ x: number; y: number } | null>(null)
  const lastFrameMs = useRef(performance.now())

  const [ready, setReady] = useState(false)

  // Always reveal the stage after the first client commit. The GSAP intro is
  // optional polish; a failed animation setup must never leave a black screen.
  useEffect(() => {
    setReady(true)
  }, [])

  function wrapCam() {
    const { w: sw, h: sh } = singleSize.current
    if (!sw || !sh) return
    // Wrap by 2× the single-copy size — the layout repeats every 2 copies
    // (A,B,A,B,A pattern), so a 2× jump always lands on an identical copy.
    const pw = 2 * sw
    const ph = 2 * sh
    if (cam.current.x < sw)       cam.current.x += pw
    if (cam.current.x > 4 * sw)   cam.current.x -= pw
    if (cam.current.y < sh)       cam.current.y += ph
    if (cam.current.y > 4 * sh)   cam.current.y -= ph
  }

  function applyWorld() {
    if (!worldRef.current) return
    const { x, y, z } = cam.current
    const vw = window.innerWidth
    const vh = window.innerHeight
    worldRef.current.style.transform =
      `translate3d(${(vw / 2 - x * z).toFixed(2)}px,${(vh / 2 - y * z).toFixed(2)}px,0) scale(${z})`
  }

  // ── Camera reset / transition on project list changes ────────────────────
  useEffect(() => {
    pendingProjects.current = projects
    momentumTw.current?.kill()
    vel.current = { x: 0, y: 0 }

    if (firstMount.current) {
      firstMount.current = false
      const c = initialCam(projects)
      cam.current.x = c.x
      cam.current.y = c.y
      worldBound.current = worldSize(projects)
      singleSize.current = { w: worldBound.current.w / H_COPIES, h: worldBound.current.h / V_COPIES }
      applyWorld()
      setReady(true)
      return
    }

    // StrictMode guard: same reference means nothing changed
    if (projects === displayedRef.current) return

    // Snapshot each old tile's screen center before React swaps the elements
    oldScreenPos.current.clear()
    tileEls.current.forEach((el) => {
      const r = el.getBoundingClientRect()
      oldScreenPos.current.set(
        `${el.dataset.baseCx},${el.dataset.baseCy}`,
        { cx: r.left + r.width / 2, cy: r.top + r.height / 2 }
      )
    })

    setDisplayedProjects(pendingProjects.current)
  }, [projects]) // eslint-disable-line react-hooks/exhaustive-deps

  // After displayedProjects swaps: reset camera + assign per-tile slide offsets
  // Children's useLayoutEffects (onMount) fire before this parent one, so
  // tileEls.current already contains all the new tile elements.
  useLayoutEffect(() => {
    displayedRef.current = displayedProjects
    if (displayedProjects === prevDisplayedRef.current) return
    prevDisplayedRef.current = displayedProjects

    const c = initialCam(displayedProjects)
    cam.current.x = c.x
    cam.current.y = c.y
    worldBound.current = worldSize(displayedProjects)
    singleSize.current = { w: worldBound.current.w / H_COPIES, h: worldBound.current.h / V_COPIES }
    applyWorld()

    if (!oldScreenPos.current.size) return

    const vw = window.innerWidth
    const vh = window.innerHeight
    const z  = cam.current.z
    const cullR = Math.hypot(vw, vh) / z + 400

    posOffset.current.clear()

    tileEls.current.forEach((el, id) => {
      const newCx = parseFloat(el.dataset.baseCx || '0')
      const newCy = parseFloat(el.dataset.baseCy || '0')
      // Only animate tiles that will be visible
      if (Math.hypot(newCx - cam.current.x, newCy - cam.current.y) > cullR) return

      // Flat (un-projected) screen center of this tile in the new layout
      const newSx = (newCx - cam.current.x) * z + vw / 2
      const newSy = (newCy - cam.current.y) * z + vh / 2

      // Find the nearest old tile screen position to slide in from
      let nearestDist = Infinity
      let nearestCx = newSx
      let nearestCy = newSy
      oldScreenPos.current.forEach((pos) => {
        const d = Math.hypot(pos.cx - newSx, pos.cy - newSy)
        if (d < nearestDist) { nearestDist = d; nearestCx = pos.cx; nearestCy = pos.cy }
      })

      let dx = nearestCx - newSx
      let dy = nearestCy - newSy
      // Cap distance so tiles don't fly in from very far away
      const dist = Math.hypot(dx, dy)
      if (dist > MAX_SLIDE_PX) { const f = MAX_SLIDE_PX / dist; dx *= f; dy *= f }

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        posOffset.current.set(id, { x: dx, y: dy })
      }
    })
  }, [displayedProjects]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── RAF: inertia + tilt + globe projection + hover scale ──────
  useEffect(() => {
    let rafId: number
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Per-tile animated state — lives in closure so it persists across frames
    const hoverScale    = new Map<string, number>()  // current animated scale (1 = rest)

    // Cursor proximity radius for hover scale (330 screen-px)
    const SPOT_R   = 330
    const HOVER_BOOST = 0.15 // maximum hover scale-up

    function tick() {
      const now = performance.now()
      const dt  = Math.min(64, now - lastFrameMs.current)
      lastFrameMs.current = now

      const vw = window.innerWidth
      const vh = window.innerHeight

      // Framerate-independent inertia decay
      if (!dragActive.current && (Math.abs(vel.current.x) > 0.01 || Math.abs(vel.current.y) > 0.01)) {
        cam.current.x += vel.current.x
        cam.current.y += vel.current.y
        const decay = Math.pow(0.935, dt / 16.67)
        vel.current.x *= decay
        vel.current.y *= decay
        wrapCam()
        applyWorld()
      }

      if (prefersReduced) {
        rafId = requestAnimationFrame(tick)
        return
      }

      // When a modal is open, lerp tilt back to neutral so tiles
      // don't freeze mid-skew. Full tile loop still runs — only targets change.
      const modalActive = isModalOpenRef.current

      // ── Tilt: cursor + idle wobble, smoothly lerped ────────────────────────
      const wobX = modalActive ? 0 : Math.sin(now * 63e-6) * 0.075
      const wobY = modalActive ? 0 : (Math.cos(now * 41e-6) * 0.7 + Math.sin(now * 63e-6 * 1.7) * 0.3) * 0.075
      const tarX = modalActive ? 0 : (cursor.current ? cursor.current.x / vw * 2 - 1 : 0) + wobX
      const tarY = modalActive ? 0 : (cursor.current ? cursor.current.y / vh * 2 - 1 : 0) + wobY
      const lerpF = Math.min(1, dt * 0.06)
      tilt.current.x += (tarX - tilt.current.x) * lerpF
      tilt.current.y += (tarY - tilt.current.y) * lerpF

      const curX = cursor.current?.x ?? vw / 2
      const curY = cursor.current?.y ?? vh / 2

      const cullRadius = Math.hypot(vw, vh) / cam.current.z + 400
      const fastLerp   = Math.min(1, dt * 0.014)
      // Exponential decay constant for the tile rearrange slide (150 ms time-constant)
      const slideRetain = Math.exp(-dt / 150)

      tileEls.current.forEach((el, id) => {
        const wx = parseFloat(el.dataset.baseCx || '0')
        const wy = parseFloat(el.dataset.baseCy || '0')
        const dx = wx - cam.current.x
        const dy = wy - cam.current.y

        if (dx * dx + dy * dy > cullRadius * cullRadius) {
          el.style.opacity       = '0'
          el.style.pointerEvents = 'none'
          return
        }

        const { ox, oy, rot, sr, st, fade } = projectTile(
          wx, wy, cam.current.x, cam.current.y, vw, vh, cam.current.z, tilt.current
        )

        // ── Rearrange slide offset ─────────────────────────────────────────
        // posOffset stores screen-pixel deltas; convert to world units (÷z) so
        // they compose correctly with the globe-projection transform.
        const off = posOffset.current.get(id)
        let slideX = 0
        let slideY = 0
        if (off) {
          off.x *= slideRetain
          off.y *= slideRetain
          if (Math.abs(off.x) < 0.3 && Math.abs(off.y) < 0.3) {
            posOffset.current.delete(id)
          } else {
            slideX = off.x / cam.current.z
            slideY = off.y / cam.current.z
          }
        }

        // Screen position for cursor proximity
        const screenX = (wx - cam.current.x) * cam.current.z + vw / 2
        const screenY = (wy - cam.current.y) * cam.current.z + vh / 2

        const deg = rot * 180 / Math.PI
        el.style.transform     = `translate(${(ox + slideX).toFixed(2)}px,${(oy + slideY).toFixed(2)}px) rotate(${deg.toFixed(1)}deg) scale(${sr.toFixed(4)},${st.toFixed(4)}) rotate(${(-deg).toFixed(1)}deg)`
        el.style.opacity       = fade > 0.999 ? '' : fade.toFixed(3)
        // Center tiles sit on top so any Xi-driven overlap is hidden behind them
        el.style.zIndex        = Math.round(fade * 100).toString()
        el.style.pointerEvents = fade > 0.02 ? 'auto' : 'none'

        // ── Hover weight: 0 (far) → 1 (under cursor) ──────────────────────
        const dist   = Math.hypot(screenX - curX, screenY - curY)
        const weight = cursor.current
          ? 1 - Math.max(0, Math.min(1, dist / SPOT_R))
          : 0

        // ── Hover scale — smooth toward target (target=1 when modal open) ──
        const curHS  = hoverScale.get(id) ?? 1
        const tarHS  = modalActive ? 1 : 1 + weight * HOVER_BOOST
        const nextHS = curHS + (tarHS - curHS) * fastLerp
        hoverScale.set(id, nextHS)

        // ── Inner div: hover zoom ──────────────────────
        const inner = el.firstElementChild as HTMLElement | null
        if (inner) {
          inner.style.transform = nextHS > 1.001 ? `scale(${nextHS.toFixed(4)})` : ''

        }
      })

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Entry animation — useLayoutEffect so GSAP sets opacity:0 before the
  // browser paints the ready=true render, preventing a flat-wall flash ─────
  useLayoutEffect(() => {
    if (!ready || !worldRef.current) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!prefersReduced) {
      gsap.fromTo(stageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.out' })
    }
  }, [ready]) // eslint-disable-line react-hooks/exhaustive-deps


  // ── Hover readout ─────────────────────────────────────────────────────────
  const lastHoveredSlug = useRef<string | null>(null)
  const lastHoveredTileId = useRef<string | null>(null)
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null)

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    cursor.current = { x: e.clientX, y: e.clientY }
    if (dragActive.current) return
    const el   = document.elementFromPoint(e.clientX, e.clientY)
    const cell = el?.closest<HTMLElement>('[data-slug]')
    const slug = cell?.dataset.slug ?? null
    const tileId = cell?.dataset.tileId ?? null
    if (tileId !== lastHoveredTileId.current) {
      lastHoveredTileId.current = tileId
      setHoveredTileId(tileId)
    }
    if (slug !== lastHoveredSlug.current) {
      lastHoveredSlug.current = slug
      onTileHover(slug ? displayedProjects.find(p => p.slug === slug) ?? null : null)
    }
  }, [displayedProjects, onTileHover])

  const onMouseLeave = useCallback(() => {
    cursor.current = null
    lastHoveredSlug.current = null
    lastHoveredTileId.current = null
    setHoveredTileId(null)
    onTileHover(null)
  }, [onTileHover])

  // ── Pointer events ─────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    lastHoveredTileId.current = null
    setHoveredTileId(null)
    momentumTw.current?.kill()
    vel.current      = { x: 0, y: 0 }
    dragActive.current  = true
    tapStart.current    = { x: e.clientX, y: e.clientY, t: e.timeStamp }
    prevPointer.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    stageRef.current?.classList.add('is-dragging')
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragActive.current) return
    const dx = e.clientX - prevPointer.current.x
    const dy = e.clientY - prevPointer.current.y
    const dt = e.timeStamp - prevPointer.current.t
    const z  = cam.current.z
    cam.current.x -= dx / z
    cam.current.y -= dy / z
    wrapCam()
    applyWorld()
    if (dt > 0) {
      vel.current.x = vel.current.x * 0.4 + (-dx / dt) * 0.6 * 16 / z
      vel.current.y = vel.current.y * 0.4 + (-dy / dt) * 0.6 * 16 / z
    }
    prevPointer.current = { x: e.clientX, y: e.clientY, t: e.timeStamp }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragActive.current) return
    dragActive.current = false
    stageRef.current?.classList.remove('is-dragging')

    const dx      = e.clientX - tapStart.current.x
    const dy      = e.clientY - tapStart.current.y
    const dist    = Math.hypot(dx, dy)
    const elapsed = e.timeStamp - tapStart.current.t

    if (dist < TAP_MAX_DIST && elapsed < TAP_MAX_MS) {
      vel.current = { x: 0, y: 0 }
      const el   = document.elementFromPoint(e.clientX, e.clientY)
      const cell = el?.closest<HTMLElement>('[data-slug]')
      const slug = cell?.dataset.slug
      if (slug) onTileClick(slug)
    }
  }, [onTileClick])

  // ── Scroll wheel — pan the wall without dragging ──────────────────────────
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      momentumTw.current?.kill()
      const z = cam.current.z
      // Normalize delta across pixel / line / page modes
      const scale = e.deltaMode === 1 ? 30 : e.deltaMode === 2 ? window.innerHeight * 0.8 : 1
      const dx = (e.deltaX * scale * 0.65) / z
      const dy = (e.deltaY * scale * 0.65) / z
      cam.current.x += dx
      cam.current.y += dy
      wrapCam()
      applyWorld()
      // Blend into velocity so the wall coasts after fast scrolling
      vel.current.x = vel.current.x * 0.5 + dx * 0.18
      vel.current.y = vel.current.y * 0.5 + dy * 0.18
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const registerTile = useCallback((instanceId: string, el: HTMLDivElement | null) => {
    if (el) tileEls.current.set(instanceId, el)
    else    tileEls.current.delete(instanceId)
  }, [])

  const onKeyActivate = useCallback((slug: string) => { onTileClick(slug) }, [onTileClick])

  return (
    <>
      <div
        ref={stageRef}
        id="stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onDragStart={(e) => e.preventDefault()}
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          touchAction: 'none',
          background: '#000',
          opacity: ready ? undefined : 1,
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <div
          ref={worldRef}
          id="world"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          {displayedProjects.map((p) => (
            <WallTile
              key={p.id}
              project={p}
              isHovered={hoveredTileId === p.id}
              onMount={registerTile}
              onKeyActivate={onKeyActivate}
            />
          ))}
        </div>
      </div>
      <Vignette />
    </>
  )
}
