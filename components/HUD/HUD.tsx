'use client'

import FlashingTitle from '../FlashingTitle'
import FilterBar from './FilterBar'
import SiteNav from '../SiteNav'
import Readout from './Readout'
import SearchBar from './SearchBar'
import type { FilterType, WallProject } from '@/lib/types'

interface HUDProps {
  activeFilter: FilterType
  onFilterChange: (f: FilterType) => void
  onHome: () => void
  hoveredProject: WallProject | null
  visible: boolean
  searchQuery: string
  onSearchChange: (v: string) => void
}

const transitionStyle = (visible: boolean): React.CSSProperties => ({
  pointerEvents: visible ? 'auto' : 'none',
  opacity: visible ? 1 : 0,
  transition: 'opacity 0.3s',
})

export default function HUD({
  activeFilter, onFilterChange, onHome, hoveredProject, visible, searchQuery, onSearchChange,
}: HUDProps) {
  return (
    <>
      <header
        className="site-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          ...transitionStyle(visible),
        }}
      >
        <button
          className="site-title"
          type="button"
          onClick={onHome}
          aria-label="Return to all projects"
          style={{
            padding: '7px 16px',
            border: 'none',
            borderRadius: 0,
            background: 'transparent',
            color: '#fff',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <FlashingTitle />
        </button>
        <SiteNav active="Projects" onProjects={onHome} />
      </header>

      <Readout project={hoveredProject} />

      {/* Bottom: filters + search */}
      <footer
        className="wall-controls"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          ...transitionStyle(visible),
        }}
      >
        <FilterBar active={activeFilter} onChange={onFilterChange} />
        <div className="wall-secondary-controls" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <SearchBar value={searchQuery} onChange={onSearchChange} />
        </div>
      </footer>
    </>
  )
}
