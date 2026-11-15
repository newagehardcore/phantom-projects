import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import AboutSections from '@/components/AboutPage/AboutSections'
import { DUMMY_ABOUT } from '@/lib/dummy-data'
import { fetchAbout, urlFor } from '@/lib/sanity'

export const metadata: Metadata = {
  title: 'About | Phantom Projects',
}

const portraitWidths = [480, 768, 1024, 1280, 1600, 1920, 2560]

function portraitSources(url: string) {
  if (!url.startsWith('https://cdn.sanity.io/images/')) return { src: url }

  const image = urlFor(url).fit('max').auto('format').quality(74)
  return {
    src: image.width(1280).url(),
    srcSet: portraitWidths.map(width => `${image.width(width).url()} ${width}w`).join(', '),
    sizes: '100vw',
  }
}

export default async function AboutPage() {
  await connection()
  const about = (await fetchAbout().catch(() => null)) ?? DUMMY_ABOUT

  return (
    <main className="about-page">
      <header className="about-page-header">
        <Link href="/" className="about-page-back">
          <span aria-hidden="true">←</span> Projects
        </Link>
        <h1>About</h1>
      </header>
      {about.photo?.url && (
        <div className="about-page-portrait">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img {...portraitSources(about.photo.url)} alt={about.photo.alt ?? 'Phantom Projects'} fetchPriority="high" />
        </div>
      )}
      <AboutSections about={about} />
    </main>
  )
}
