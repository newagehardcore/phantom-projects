import type { ReactNode } from 'react'
import type { About } from '@/lib/types'
import { clientGroups, pressClips } from './aboutContent'

export type AboutSection = 'About' | 'Credits' | 'Press'

export default function AboutSections({ about, portrait, section }: {
  about: About
  portrait: ReactNode
  section: AboutSection
}) {
  const socials = [
    ...(about.contactEmail ? [{ label: 'Email', url: `mailto:${about.contactEmail}` }] : []),
    ...(about.socials ?? []),
  ]

  return (
    <div className="about-page-sections" data-bio-layout={section === 'About' && portrait ? '' : undefined}>
      {portrait}
      <div className="about-page-content">
        {section === 'About' && (
          <div className="about-bio">
            {about.headerDescription && (
              <h2 className="about-page-heading">
                {about.headerDescription}
              </h2>
            )}

            {about.bio && (
              <p className="about-bio-copy">
                {about.bio}
              </p>
            )}

            {socials.length > 0 && (
              <div className="about-socials">
                {socials.map((s, i) => (
                  <a
                    key={`${s.label}-${s.url}-${i}`}
                    href={s.url}
                    target={s.url.startsWith('mailto:') ? undefined : '_blank'}
                    rel={s.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {section === 'Press' && (
          <div className="about-press-grid">
            {pressClips.map(({ publication, quote, logo }) => (
              <figure key={publication} className="about-press-clip">
                <blockquote>“{quote}”</blockquote>
                <figcaption>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/press/${logo}.png`} alt={publication} />
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {section === 'Credits' && clientGroups.map(({ heading, clients, textOnly }) => (
          <section key={heading} className="about-client-group">
            <h2>{heading}</h2>
            {textOnly ? (
              <ul className="about-collaborator-list" role="list">
                {clients.map(({ name, href }, index) => (
                  <li key={name}>
                    <a href={href} target="_blank" rel="noopener noreferrer">{name}</a>
                    {index < clients.length - 1 && ', '}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="about-client-grid">
                {clients.map(({ name, href, location, logo }) => (
                  <li key={name}>
                    <a className="about-client-tile" href={href} target="_blank" rel="noopener noreferrer">
                      {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logo} alt={name} loading="lazy" />
                      ) : <span>{name}</span>}
                      {location && <small>{location}</small>}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
