interface AboutButtonProps {
  onClick: () => void
}

export default function AboutButton({ onClick }: AboutButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open about"
      style={{
        padding: '7px 16px',
        border: 'none',
        borderRadius: 0,
        background: 'transparent',
        color: '#fff',
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: '-0.03em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = '#fff'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#000'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
      }}
    >
      About
    </button>
  )
}
