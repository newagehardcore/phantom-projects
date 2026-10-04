'use client'

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div
      className="wall-search"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #fff',
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <svg
        width="13" height="13" viewBox="0 0 13 13" fill="none"
        aria-hidden
        style={{ position: 'absolute', left: 9, pointerEvents: 'none', color: '#fff', flexShrink: 0 }}
      >
        <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8.5 8.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search"
        aria-label="Search projects"
        enterKeyHint="search"
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
        style={{
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          lineHeight: '18px',
          padding: '7px 28px 7px 28px',
          outline: 'none',
          width: 178,
          fontFamily: 'inherit',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: 8,
            background: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: 1,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
