import type { Project, WallProject, FilterType } from './types'

// ─── Layout constants ────────────────────────────────────────────────────────
export const TILE_W = 495
export const TILE_H = 360
const GAP = 2
export const CELL_W = TILE_W + GAP
export const CELL_H = TILE_H + GAP
export const COLS = 7

// Tile count in each direction. All copies share the same sorted order so the
// pattern repeats visually — the user can pan forever and see familiar tiles.
export const H_COPIES = 5
export const V_COPIES = 5

// ─── Globe projection constants ───────────────────────────────────────────────
const Gt = 0.24
const Xi = 0.02
const Ui = 0.05
const Zi = (1 / (3 * Gt)) * 0.94

// Tilt: how much cursor shifts the globe center (ke) and tile vector (Se)
const TILT_K = 0.10
const TILT_E = 0.03

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * Globe perspective projection with cursor tilt.
 * Returns world-space offsets (ox, oy), anisotropic scale factors (sr = radial,
 * st = tangential), the rotation angle (rot, radians), a base scale for hover
 * animation, and the edge fade.
 *
 * Apply as: translate(ox,oy) rotate(rot°) scale(sr*hover, st*hover) rotate(-rot°)
 */
export function projectTile(
  tileCx: number, tileCy: number,
  camX: number, camY: number,
  vw: number, vh: number,
  zoom = 1,
  tilt = { x: 0, y: 0 }
): { ox: number; oy: number; rot: number; sr: number; st: number; scale: number; fade: number } {
  const a  = tileCx - camX
  const r  = tileCy - camY
  const as = a * zoom
  const rs = r * zoom
  const n  = Math.hypot(vw / 2, vh / 2) || 1

  // Tilt shifts the globe "peak" toward the cursor in screen space
  const at = as - tilt.x * (TILT_K + TILT_E) * n
  const rt = rs - tilt.y * (TILT_K + TILT_E) * n
  const l  = Math.min((at * at + rt * rt) / (n * n), Zi)

  const g  = 1 - Gt
  const v  = (1 - Gt * l) / g
  const m  = (1 - 3 * Gt * l) / g
  const u  = 1 + Xi * Math.max(0, 1 - l)

  // Anisotropic scale: radial (sr) shrinks faster at edges than tangential (st)
  const vx = Math.max(1e-4, v)
  const M  = Math.max(vx * 0.62, m)
  const rot = Math.atan2(rt, at)           // direction from globe center to tile
  const st  = vx * u                       // tangential scale
  const sr  = M  * u                       // radial scale — squashes at edges

  // Tilt world-space parallax offset
  const tf  = (n / zoom) * (TILT_K * (1 - v) - TILT_E * v)
  const ox  = a * (v - 1) + tilt.x * tf
  const oy  = r * (v - 1) + tilt.y * tf

  const fade  = smoothstep(0, Ui, m)
  const scale = Math.max(1e-4, Math.sqrt(v * Math.max(0.02, m))) * u

  return { ox, oy, rot, sr, st, scale, fade }
}

// Deterministic Fisher-Yates using a simple LCG — same seed → same shuffle.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  let s = (seed + 1) | 0
  const rand = () => {
    s = Math.imul(s, 1664525) + 1013904223 | 0
    return (s >>> 0) / 0x100000000
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Shuffle complete passes so every project appears once before any repeats. */
function buildShuffledGrid(sorted: Project[], seed: number, rows: number, cols = COLS): Project[] {
  const total = rows * cols
  const grid: Project[] = []
  let pass = 0

  while (grid.length < total) {
    grid.push(...seededShuffle([...sorted], seed + pass * 7919).slice(0, total - grid.length))
    pass++
  }

  return grid
}

/**
 * Lay out all copies of the projects so the wall always fills completely.
 *
 * - Complete shuffled passes across a 2×2 tile, split into four sections so
 *   every filtered project appears before any project is repeated.
 * - Every cell is filled (cycles when fewer projects than cells exist) so
 *   filtered views never leave empty columns.
 * - 2×2 period means camera wrapping by 2×singleSize lands on an identical
 *   arrangement, making the seam invisible.
 */
export function layoutProjects(projects: Project[]): WallProject[] {
  if (!projects.length) return []
  const sorted  = [...projects].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
  const rows    = Math.max(4, Math.ceil(sorted.length / COLS))
  const singleW = COLS * CELL_W
  const singleH = rows * CELL_H
  const result: WallProject[] = []

  // Build one sequence over the full 2×2 repeating section so each matching
  // project appears before the pattern cycles back around.
  const repeatingGrid = buildShuffledGrid(sorted, 0, rows * 2, COLS * 2)

  for (let vy = 0; vy < V_COPIES; vy++) {
    for (let hx = 0; hx < H_COPIES; hx++) {
      const gridProjects = Array.from({ length: rows }, (_, row) => {
        const start = (((vy % 2) * rows + row) * COLS * 2) + (hx % 2) * COLS
        return repeatingGrid.slice(start, start + COLS)
      }).flat()

      gridProjects.forEach((p, i) => {
        result.push({
          ...p,
          id: `${p.id}-${vy}-${hx}-${i}`,
          x:  hx * singleW + (i % COLS)          * CELL_W,
          y:  vy * singleH + Math.floor(i / COLS) * CELL_H,
          w:  TILE_W,
          h:  TILE_H,
        })
      })
    }
  }
  return result
}

export function worldSize(projects: WallProject[]): { w: number; h: number } {
  let maxX = 0, maxY = 0
  for (const p of projects) {
    if (p.x + p.w > maxX) maxX = p.x + p.w
    if (p.y + p.h > maxY) maxY = p.y + p.h
  }
  return { w: maxX, h: maxY }
}

export function initialCam(projects: WallProject[]): { x: number; y: number } {
  const { w, h } = worldSize(projects)
  return { x: w / 2, y: h / 2 }
}

export function getVisibleProjects(projects: WallProject[], filter: FilterType): WallProject[] {
  if (filter === 'All') return projects
  return projects.filter((p) => p.type.includes(filter as import('./types').ProjectType))
}

export function getShuffleTarget(
  projects: WallProject[],
  filter: FilterType,
  camX: number, camY: number,
  vw: number, vh: number
): { x: number; y: number } | null {
  const visible = getVisibleProjects(projects, filter)
  if (!visible.length) return null
  const target = visible[Math.floor(Math.random() * visible.length)]
  return { x: target.x + target.w / 2, y: target.y + target.h / 2 }
}

export function getEmbedUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl)
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const vid = u.searchParams.get('v') || u.pathname.split('/').pop() || ''
      return `https://www.youtube.com/embed/${vid}`
    }
    if (u.hostname.includes('vimeo.com')) {
      const vid = u.pathname.split('/').filter(Boolean).pop() || ''
      return `https://player.vimeo.com/video/${vid}`
    }
  } catch { /* fall through */ }
  return rawUrl
}
