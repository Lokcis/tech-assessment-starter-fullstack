import { useState } from 'react'
import { AccountTree } from './components/AccountTree'
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal'
import { CreateAccountForm } from './components/CreateAccountForm'
import { ErrorBanner, LoadingState, RefreshingBar } from './components/FeedbackStates'
import { useAccounts } from './hooks/useAccounts'
import type { AccountTreeNode } from './types/account'

function App() {
  const {
    accounts,
    loading,
    refreshing,
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

  const isBusyReload = loading || refreshing
  const showInitialLoading = loading && accounts.length === 0
  const showInitialError = !loading && Boolean(error) && accounts.length === 0
  const showRefreshError = !isBusyReload && Boolean(error) && accounts.length > 0

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
          disabled={isBusyReload}
        >
          {isBusyReload ? (
            <>
              <span className="spinner spinner--sm" aria-hidden="true" />
              <span>Actualizando...</span>
            </>
          ) : (
            'Actualizar catálogo'
          )}
        </button>
      </header>

      <div className="app-grid">
        <aside className="app-grid__sidebar">
          <CreateAccountForm
            accounts={accounts}
            creating={creating}
            catalogLoading={loading}
            catalogError={error}
            onCreate={create}
          />
        </aside>

        <section className="app-grid__content">
          <div className="card">
            {showInitialLoading ? (
              <LoadingState message="Cargando catálogo de cuentas..." />
            ) : showInitialError && error ? (
              <ErrorBanner
                title="No se pudo cargar el catálogo"
                message={error}
                onRetry={() => void reload()}
                retrying={isBusyReload}
              />
            ) : (
              <>
                {refreshing && <RefreshingBar message="Actualizando catálogo de cuentas..." />}
                {deletingCode && (
                  <RefreshingBar message={`Eliminando cuenta ${deletingCode}...`} />
                )}
                {showRefreshError && error && (
                  <div className="tree-feedback">
                    <ErrorBanner
                      title="No se pudo actualizar el catálogo"
                      message={error}
                      onRetry={() => void reload()}
                      retrying={isBusyReload}
                    />
                  </div>
                )}

                <AccountTree
                  accounts={accounts}
                  deletingCode={deletingCode}
                  deleteError={deleteError}
                  deleteSuccess={deleteSuccess}
                  onRequestDelete={handleRequestDelete}
                  onDismissDeleteError={clearDeleteError}
                  onDismissDeleteSuccess={() => setDeleteSuccess(null)}
                />
              </>
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
