import Link from 'next/link'

const pages = [
  { label: 'Projects', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Credits', href: '/credits' },
  { label: 'Press', href: '/press' },
] as const

export default function SiteNav({ active, onProjects }: {
  active: (typeof pages)[number]['label']
  onProjects?: () => void
}) {
  return (
    <nav className="site-nav" aria-label="Main navigation">
      {pages.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          aria-current={active === label ? 'page' : undefined}
          onNavigate={label === 'Projects' && onProjects ? (event) => {
            event.preventDefault()
            onProjects()
          } : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
