export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading projects"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(4, minmax(0, 1fr))',
          gap: 2,
        }}
      >
        {Array.from({ length: 24 }, (_, index) => (
          <div
            key={index}
            style={{
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.025)',
            }}
          />
        ))}
      </div>
      <header style={{ position: 'absolute', top: 0, left: 0, padding: '18px 24px' }}>
        <div
          style={{
            padding: '7px 16px',
            color: '#fff',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            fontFamily: 'inherit',
          }}
        >
          PHANTOM PROJECTS
        </div>
      </header>
    </main>
  )
}
