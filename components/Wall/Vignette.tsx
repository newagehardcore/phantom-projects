export default function Vignette() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2,
        background:
          'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
      }}
    />
  )
}
