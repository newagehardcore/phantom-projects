import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import MainScene from '@/components/MainScene'
import { fetchProjects } from '@/lib/sanity'

function Scene({ projects }: {
  projects: Awaited<ReturnType<typeof fetchProjects>>
}) {
  return (
    <Suspense fallback={null}>
      <MainScene projects={projects} />
    </Suspense>
  )
}

async function ProjectScene() {
  let projects: Awaited<ReturnType<typeof fetchProjects>> = []
  try {
    projects = await fetchProjects()
  } catch (e) {
    console.error('[page] Sanity project fetch failed', e)
  }

  return <Scene projects={projects} />
}

export default async function Page({ searchParams }: {
  searchParams: Promise<{ about?: string | string[] }>
}) {
  await connection()
  const { about } = await searchParams
  if (about === '1' || (Array.isArray(about) && about[0] === '1')) redirect('/about')

  return (
    <Suspense fallback={<Scene projects={[]} />}>
      <ProjectScene />
    </Suspense>
  )
}

