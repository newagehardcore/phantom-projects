interface ShuffleButtonProps {
  onClick: () => void
}

export default function ShuffleButton({ onClick }: ShuffleButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Shuffle to random project"
      style={{
        padding: '6px 16px',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: 20,
        background: 'transparent',
        color: '#fff',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.06em',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transform: 'rotate(-1.5deg)',
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
      Shuffle
    </button>
  )
}
