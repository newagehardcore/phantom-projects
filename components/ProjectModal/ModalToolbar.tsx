import type { Ref } from 'react'

interface ModalToolbarProps {
  closeRef: Ref<HTMLButtonElement>
  closeLabel: string
  navigationLabel: string
  previousLabel: string
  nextLabel: string
  onClose: () => void
  onPrevious?: () => void
  onNext?: () => void
}

export default function ModalToolbar({
  closeRef, closeLabel, navigationLabel, previousLabel, nextLabel, onClose, onPrevious, onNext,
}: ModalToolbarProps) {
  return (
    <div className="modal-toolbar">
      <nav className="modal-actions" aria-label={navigationLabel}>
        <button type="button" onClick={onPrevious} disabled={!onPrevious} aria-label={previousLabel} className="modal-edge-control">
          <span aria-hidden="true">←</span>
        </button>
        <button type="button" onClick={onNext} disabled={!onNext} aria-label={nextLabel} className="modal-edge-control">
          <span aria-hidden="true">→</span>
        </button>
      </nav>
      <button ref={closeRef} type="button" onClick={onClose} aria-label={closeLabel} className="modal-edge-control modal-close-control">
        Close <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}
