'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Wall from './Wall/Wall'
import HUD from './HUD/HUD'
import ProjectModal from './ProjectModal/ProjectModal'
import AboutModal from './AboutModal/AboutModal'
import { layoutProjects } from '@/lib/wallUtils'
import type { Project, WallProject, About, FilterType } from '@/lib/types'
import { TILE_W, TILE_H } from '@/lib/wallUtils'

interface MainSceneProps {
  projects: Project[]
  about: About
}

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
}

function projectDateValue(date?: string) {
  if (!date) return Number.POSITIVE_INFINITY
  const normalized = date.trim().toLowerCase()
  const namedMonth = normalized.match(/^([a-z]+)\s+(\d{4})$/)
  if (namedMonth && namedMonth[1] in MONTHS) return Number(namedMonth[2]) * 12 + MONTHS[namedMonth[1]]
  const storedMonth = normalized.match(/^(\d{4})-(0[1-9]|1[0-2])$/)
  if (storedMonth) return Number(storedMonth[1]) * 12 + Number(storedMonth[2]) - 1
  const legacyMonth = normalized.match(/^(0?[1-9]|1[0-2])-(\d{4})$/)
  if (legacyMonth) return Number(legacyMonth[2]) * 12 + Number(legacyMonth[1]) - 1
  const parsed = Date.parse(date)
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed
}

export default function MainScene({ projects, about }: MainSceneProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeFilter, setActiveFilter] = useState<FilterType>('All')
  const [activeRole, setActiveRole] = useState<string | null>(null)
  const [hoveredProject, setHoveredProject] = useState<WallProject | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Re-layout whenever filter or search changes — results always tile to fill the wall
  const wallProjects = useMemo(() => {
    let subset = activeFilter === 'All'
      ? projects
      : projects.filter(p => p.type.includes(activeFilter as import('@/lib/types').ProjectType))

    if (activeRole) subset = subset.filter(p => p.roles?.includes(activeRole))

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      subset = subset.filter(p => {
        const fields: (string | undefined)[] = [
          p.title,
          p.description,
          p.subtitleName,
          ...(p.type ?? []),
          ...(p.roles ?? []),
          ...(p.collaborators?.map(c => c.name) ?? []),
          ...(p.press?.map(pr => pr.name) ?? []),
          ...(p.presentedAt?.map(pa => pa.name) ?? []),
          ...(p.watchOn?.map(w => w.name) ?? []),
        ]
        return fields.some(f => f?.toLowerCase().includes(q))
      })
    }

    return layoutProjects(subset)
  }, [projects, activeFilter, activeRole, searchQuery])

  const activeProjectSlug = searchParams.get('project')
  const isAboutOpen = searchParams.get('about') === '1'

  // Find the active project. Search wallProjects first; if filter changed while
  // modal is open the slug may not be there, so fall back to raw projects.
  const activeProject: WallProject | null = useMemo(() => {
    if (!activeProjectSlug) return null
    const fromWall = wallProjects.find(p => p.slug === activeProjectSlug)
    if (fromWall) return fromWall
    const raw = projects.find(p => p.slug === activeProjectSlug)
    return raw ? { ...raw, x: 0, y: 0, w: TILE_W, h: TILE_H } : null
  }, [activeProjectSlug, wallProjects, projects])

  const chronologicalProjects = useMemo(() => (
    [...projects].sort((a, b) => {
      const dateDifference = projectDateValue(a.date) - projectDateValue(b.date)
      return dateDifference || a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    })
  ), [projects])

  const activeChronologicalIndex = activeProjectSlug
    ? chronologicalProjects.findIndex(project => project.slug === activeProjectSlug)
    : -1
  const previousProject = activeChronologicalIndex > 0
    ? chronologicalProjects[activeChronologicalIndex - 1]
    : null
  const nextProject = activeChronologicalIndex >= 0 && activeChronologicalIndex < chronologicalProjects.length - 1
    ? chronologicalProjects[activeChronologicalIndex + 1]
    : null

  const openProject = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('project', slug)
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const closeProject = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('project')
    router.push(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const navigateProject = useCallback((slug: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('project', slug)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const filterFromModal = useCallback((filter: FilterType | { role: string }) => {
    if (typeof filter === 'string') {
      setActiveFilter(filter)
      setActiveRole(null)
    } else {
      setActiveFilter('All')
      setActiveRole(filter.role)
    }
    closeProject()
  }, [closeProject])

  const openAbout = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('about', '1')
    router.push(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const closeAbout = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('about')
    router.push(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const returnHome = useCallback(() => {
    setActiveFilter('All')
    setActiveRole(null)
    setSearchQuery('')
    router.push('/', { scroll: false })
  }, [router])

  const isModalOpen = !!activeProject || isAboutOpen

  return (
    <>
      <Wall
        projects={wallProjects}
        isModalOpen={isModalOpen}
        onTileClick={openProject}
        onTileHover={setHoveredProject}
      />
      <HUD
        activeFilter={activeFilter}
        onFilterChange={(filter) => { setActiveFilter(filter); setActiveRole(null) }}
        onAbout={openAbout}
        onHome={returnHome}
        hoveredProject={hoveredProject}
        visible={!isModalOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      {activeProject && (
        <ProjectModal
          project={activeProject}
          onClose={closeProject}
          onFilter={filterFromModal}
          onPrevious={previousProject ? () => navigateProject(previousProject.slug) : undefined}
          onNext={nextProject ? () => navigateProject(nextProject.slug) : undefined}
        />
      )}
      {isAboutOpen && (
        <AboutModal
          about={about}
          onClose={closeAbout}
        />
      )}
    </>
  )
}
