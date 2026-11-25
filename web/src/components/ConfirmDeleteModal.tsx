import { useEffect } from 'react'
import type { AccountTreeNode } from '../types/account'

interface ConfirmDeleteModalProps {
  account: AccountTreeNode | null
  deleting: boolean
  onCancel: () => void
  onConfirm: (account: AccountTreeNode) => void
}

export function ConfirmDeleteModal({
  account,
  deleting,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!account) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleting) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [account, deleting, onCancel])

  if (!account) {
    return null
  }

  const childCount = account.children.length

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!deleting) {
          onCancel()
        }
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-description"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="confirm-delete-title" className="modal__title">
            Confirmar eliminación
          </h2>
        </div>

        <div id="confirm-delete-description" className="modal__body">
          <p className="modal__text">
            ¿Seguro que deseas eliminar la cuenta{' '}
            <code className="tree-code">{account.code}</code>{' '}
            <strong>{account.name}</strong>?
          </p>

          {childCount > 0 ? (
            <div className="alert alert--warning" role="note">
              Esta cuenta tiene <strong>{childCount}</strong>{' '}
              {childCount === 1 ? 'cuenta hija directa' : 'cuentas hijas directas'}. Al confirmar, la API validará esta restricción y rechazará la eliminación si aún tiene dependientes.
            </div>
          ) : (
            <p className="modal__hint">
              Esta acción eliminará la cuenta permanentemente del catálogo. Si su cuenta padre queda sin hijas, volverá a admitir movimientos.
            </p>
          )}
        </div>

        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => onConfirm(account)}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <span className="spinner spinner--sm spinner--light" aria-hidden="true" />
                <span>Eliminando...</span>
              </>
            ) : (
              'Sí, eliminar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
