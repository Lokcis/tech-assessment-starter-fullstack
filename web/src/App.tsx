import { useState } from 'react'
import { AccountTree } from './components/AccountTree'
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal'
import { CreateAccountForm } from './components/CreateAccountForm'
import { useAccounts } from './hooks/useAccounts'
import type { AccountTreeNode } from './types/account'

function App() {
  const {
    accounts,
    loading,
    creating,
    deletingCode,
    error,
    deleteError,
    reload,
    create,
    remove,
    clearDeleteError,
  } = useAccounts()

  const [pendingDelete, setPendingDelete] = useState<AccountTreeNode | null>(null)
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null)

  const handleRequestDelete = (node: AccountTreeNode) => {
    setDeleteSuccess(null)
    clearDeleteError()
    setPendingDelete(node)
  }

  const handleConfirmDelete = async (node: AccountTreeNode) => {
    const deleted = await remove(node.code)
    setPendingDelete(null)
    if (deleted) {
      setDeleteSuccess(`Cuenta "${node.code} — ${node.name}" eliminada correctamente.`)
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-header__title">Catálogo de Cuentas</h1>
          <p className="app-header__subtitle">
            Plan de cuentas jerárquico organizado por clase, grupo, cuenta y subcuenta.
          </p>
        </div>

        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => void reload()}
          disabled={loading}
        >
          {loading ? 'Actualizando...' : 'Actualizar catálogo'}
        </button>
      </header>

      <div className="app-grid">
        <aside className="app-grid__sidebar">
          <CreateAccountForm
            accounts={accounts}
            creating={creating}
            onCreate={create}
          />
        </aside>

        <section className="app-grid__content">
          <div className="card">
            {loading && accounts.length === 0 ? (
              <div className="loading-state" role="status" aria-live="polite">
                <span className="spinner" aria-hidden="true" />
                <span>Cargando catálogo de cuentas...</span>
              </div>
            ) : error ? (
              <div className="status-banner status-banner--error" role="alert">
                <div className="status-banner__content">
                  <p className="status-banner__title">No se pudo cargar el catálogo</p>
                  <p className="status-banner__message">{error}</p>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => void reload()}
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <AccountTree
                accounts={accounts}
                deletingCode={deletingCode}
                deleteError={deleteError}
                deleteSuccess={deleteSuccess}
                onRequestDelete={handleRequestDelete}
                onDismissDeleteError={clearDeleteError}
                onDismissDeleteSuccess={() => setDeleteSuccess(null)}
              />
            )}
          </div>
        </section>
      </div>

      <ConfirmDeleteModal
        account={pendingDelete}
        deleting={pendingDelete !== null && deletingCode === pendingDelete.code}
        onCancel={() => setPendingDelete(null)}
        onConfirm={(node) => void handleConfirmDelete(node)}
      />
    </main>
  )
}

export default App
