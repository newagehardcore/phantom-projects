import { Suspense } from 'react'
import { connection } from 'next/server'
import MainScene from '@/components/MainScene'
import { fetchProjects, fetchAbout } from '@/lib/sanity'
import { DUMMY_ABOUT } from '@/lib/dummy-data'

export default async function Page() {
  await connection()
  let projects: Awaited<ReturnType<typeof fetchProjects>> = []
  let about: Awaited<ReturnType<typeof fetchAbout>> = null
  try {
    ;[projects, about] = await Promise.all([fetchProjects(), fetchAbout().catch(() => null)])
  } catch (e) {
    console.error('[page] Sanity project fetch failed', e)
  }

  return (
    <Suspense>
      <MainScene projects={projects} about={about ?? DUMMY_ABOUT} />
    </Suspense>
  )
}
