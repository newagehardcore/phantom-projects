'use client'

import { useRef, useId, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import type { About } from '@/lib/types'
import { clientGroups, pressClips } from './aboutContent'

const tabs = ['Bio', 'Press', 'Credits'] as const
type AboutTab = (typeof tabs)[number]

export default function AboutSections({ about, portrait }: { about: About; portrait: ReactNode }) {
  const [tab, setTab] = useState<AboutTab>('Bio')
  const tabsId = useId()
  const tabListRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const panelId = `${tabsId}-panel`
  const tabId = (name: AboutTab) => `${tabsId}-${name.toLowerCase()}`

  function selectTab(next: AboutTab) {
    if (next === tab) return
    const tabList = tabListRef.current
    const panel = panelRef.current
    if (tabList && panel) {
      const distance = panel.getBoundingClientRect().top - tabList.getBoundingClientRect().bottom
      if (distance < 0) window.scrollBy(0, distance)
    }
    setTab(next)
  }

  function onTabKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % tabs.length; break
      case 'ArrowLeft': next = (index + tabs.length - 1) % tabs.length; break
      case 'Home': next = 0; break
      case 'End': next = tabs.length - 1; break
      default: return
    }
    event.preventDefault()
    selectTab(tabs[next])
    tabRefs.current[next]?.focus({ preventScroll: true })
  }

  const socials = [
    ...(about.contactEmail ? [{ label: 'Email', url: `mailto:${about.contactEmail}` }] : []),
    ...(about.socials ?? []),
  ]

  return (
    <div className="about-page-sections" data-bio-layout={tab === 'Bio' && portrait ? '' : undefined}>
      {portrait}
      <div ref={tabListRef} className="about-page-tabs" role="tablist" aria-label="About sections">
        {tabs.map((name, index) => (
          <button
            key={name}
            ref={(button) => { tabRefs.current[index] = button }}
            id={tabId(name)}
            type="button"
            role="tab"
            aria-selected={tab === name}
            aria-controls={panelId}
            tabIndex={tab === name ? 0 : -1}
            onClick={() => selectTab(name)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            {name}
          </button>
        ))}
      </div>

      <div
        ref={panelRef}
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(tab)}
        tabIndex={0}
        className="about-page-content"
      >
        {tab === 'Bio' && (
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

        {tab === 'Press' && (
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

        {tab === 'Credits' && clientGroups.map(({ heading, clients, textOnly }) => (
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
