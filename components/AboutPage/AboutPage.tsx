import Link from 'next/link'
import { connection } from 'next/server'
import AboutSections, { type AboutSection } from './AboutSections'
import FlashingTitle from '@/components/FlashingTitle'
import SiteNav from '@/components/SiteNav'
import { DUMMY_ABOUT } from '@/lib/dummy-data'
import { fetchAbout, urlFor } from '@/lib/sanity'

const portraitWidths = [480, 768, 1024, 1280, 1600]

function portraitSources(url: string, section: AboutSection) {
  if (!url.startsWith('https://cdn.sanity.io/images/')) return { src: url }

  const image = urlFor(url).fit('max').auto('format').quality(74)
  return {
    src: image.width(1024).url(),
    srcSet: portraitWidths.map(width => `${image.width(width).url()} ${width}w`).join(', '),
    sizes: section === 'About'
      ? '(min-width: 1560px) 598px, (min-width: 801px) 39vw, (min-width: 400px) 92vw, calc(100vw - 32px)'
      : '100vw',
  }
}

export default async function AboutPage({ section }: { section: AboutSection }) {
  await connection()
  const about = (await fetchAbout().catch(() => null)) ?? DUMMY_ABOUT
  const photo = about.photo
  const portrait = photo?.url ? (
    <div className="about-page-portrait">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...portraitSources(photo.url, section)} alt={photo.alt ?? 'Phantom Projects'} fetchPriority="high" />
    </div>
  ) : null

  return (
    <main className="about-page">
      <header className="about-page-header">
        <Link href="/" className="site-title about-page-masthead" aria-label="Phantom Projects home">
          <FlashingTitle />
        </Link>
        <SiteNav active={section} />
      </header>
      <h1 className="sr-only">{section}</h1>
      <AboutSections about={about} portrait={portrait} section={section} />
    </main>
  )
}
