export default function Logo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Phantom Projects"
      style={{
        display: 'block',
        height: 90,
        width: 'auto',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    />
  )
}
