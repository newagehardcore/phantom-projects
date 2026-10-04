import { Suspense } from 'react'
import MainScene from '@/components/MainScene'
import { fetchProjects, fetchAbout } from '@/lib/sanity'
import { DUMMY_ABOUT } from '@/lib/dummy-data'

function Scene({ projects, about }: {
  projects: Awaited<ReturnType<typeof fetchProjects>>
  about: NonNullable<Awaited<ReturnType<typeof fetchAbout>>>
}) {
  return (
    <Suspense fallback={null}>
      <MainScene projects={projects} about={about} />
    </Suspense>
  )
}

async function ProjectScene() {
  let projects: Awaited<ReturnType<typeof fetchProjects>> = []
  let about = DUMMY_ABOUT
  try {
    const [fetchedProjects, fetchedAbout] = await Promise.all([
      fetchProjects(),
      fetchAbout().catch(() => null),
    ])
    projects = fetchedProjects
    about = fetchedAbout ?? DUMMY_ABOUT
  } catch (e) {
    console.error('[page] Sanity project fetch failed', e)
  }

  return <Scene projects={projects} about={about} />
}

export default async function Page() {
  return (
    <Suspense fallback={<Scene projects={[]} about={DUMMY_ABOUT} />}>
      <ProjectScene />
    </Suspense>
  )
}

