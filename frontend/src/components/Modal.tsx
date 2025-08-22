import React from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  onConfirm: () => void
  confirmLabel?: string
  confirmDisabled?: boolean
  children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({ open, title, onClose, onConfirm, confirmLabel = 'Salvar', confirmDisabled, children }) => {
  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true">
        <h3>{title}</h3>
        {children}
        <div className="modal-acoes">
            <button type="button" className="btn btn-md secundario" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-md primario" onClick={onConfirm} disabled={confirmDisabled}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default Modal
