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
