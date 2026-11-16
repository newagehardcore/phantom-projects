import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import AboutSections from '@/components/AboutPage/AboutSections'
import FlashingTitle from '@/components/FlashingTitle'
import { DUMMY_ABOUT } from '@/lib/dummy-data'
import { fetchAbout, urlFor } from '@/lib/sanity'

export const metadata: Metadata = {
  title: 'About | Phantom Projects',
}

const portraitWidths = [480, 768, 1024, 1280, 1600]

function portraitSources(url: string) {
  if (!url.startsWith('https://cdn.sanity.io/images/')) return { src: url }

  const image = urlFor(url).fit('max').auto('format').quality(74)
  return {
    src: image.width(1024).url(),
    srcSet: portraitWidths.map(width => `${image.width(width).url()} ${width}w`).join(', '),
    sizes: '(min-width: 801px) 40vw, 100vw',
  }
}

export default async function AboutPage() {
  await connection()
  const about = (await fetchAbout().catch(() => null)) ?? DUMMY_ABOUT
  const photo = about.photo
  const portrait = photo?.url ? (
    <div className="about-page-portrait">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...portraitSources(photo.url)} alt={photo.alt ?? 'Phantom Projects'} fetchPriority="high" />
    </div>
  ) : null

  return (
    <main className="about-page">
      <header className="about-page-header">
        <Link href="/" className="site-title about-page-masthead" aria-label="Phantom Projects home">
          <FlashingTitle />
        </Link>
        <h1 className="sr-only">About Phantom Projects</h1>
      </header>
      <AboutSections about={about} portrait={portrait} />
    </main>
  )
}
