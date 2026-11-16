const paths = {
  close: 'M4 4l16 16M20 4L4 20',
  previous: 'M20 12H4m7-7-7 7 7 7',
  next: 'M4 12h16m-7-7 7 7-7 7',
}

export default function ModalIcon({ icon }: { icon: keyof typeof paths }) {
  return (
    <svg className="modal-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={paths[icon]} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
