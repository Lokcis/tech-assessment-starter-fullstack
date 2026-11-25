import { useState } from 'react'
import { AccountTree } from './components/AccountTree'
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal'
import { CreateAccountForm } from './components/CreateAccountForm'
import type { ChildPrefillTarget } from './components/CreateAccountForm'
import { ErrorBanner, LoadingState, RefreshingBar } from './components/FeedbackStates'
import { useAccounts } from './hooks/useAccounts'
import type { DeleteErrorState } from './hooks/useAccounts'
import { ApiError } from './services/httpClient'
import type { AccountTreeNode } from './types/account'

function App() {
  const {
    accounts,
    loading,
    refreshing,
    creating,
    renamingCode,
    deletingCode,
    error,
    deleteError,
    reload,
    create,
    rename,
    remove,
    clearDeleteError,
  } = useAccounts()

  const [pendingDelete, setPendingDelete] = useState<AccountTreeNode | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [renameError, setRenameError] = useState<DeleteErrorState | null>(null)
  const [prefillParent, setPrefillParent] = useState<ChildPrefillTarget | null>(null)

  const handleRequestCreateChild = (node: AccountTreeNode) => {
    setActionSuccess(null)
    setRenameError(null)
    clearDeleteError()
    setPrefillParent((prev) => ({
      parent: node,
      requestId: (prev?.requestId ?? 0) + 1,
    }))
  }

  const handleRename = async (code: string, newName: string): Promise<boolean> => {
    setActionSuccess(null)
    setRenameError(null)
    clearDeleteError()

    try {
      const updated = await rename(code, newName)
      setActionSuccess(`Cuenta "${updated.code}" renombrada a "${updated.name}".`)
      return true
    } catch (err: unknown) {
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : `No se pudo renombrar la cuenta "${code}". Intenta nuevamente.`
      setRenameError({ code, message })
      return false
    }
  }

  const handleRequestDelete = (node: AccountTreeNode) => {
    setActionSuccess(null)
    setRenameError(null)
    clearDeleteError()
    setPendingDelete(node)
  }

  const handleConfirmDelete = async (node: AccountTreeNode) => {
    const deleted = await remove(node.code)
    setPendingDelete(null)
    if (deleted) {
      if (prefillParent?.parent.code === node.code) {
        setPrefillParent(null)
      }
      setActionSuccess(`Cuenta "${node.code} — ${node.name}" eliminada correctamente.`)
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
            prefillParent={prefillParent}
            onClearPrefillParent={() => setPrefillParent(null)}
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
                {renamingCode && (
                  <RefreshingBar message={`Renombrando cuenta ${renamingCode}...`} />
                )}
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
                  renamingCode={renamingCode}
                  deleteError={deleteError}
                  renameError={renameError}
                  actionSuccess={actionSuccess}
                  onRequestCreateChild={handleRequestCreateChild}
                  onRename={handleRename}
                  onRequestDelete={handleRequestDelete}
                  onDismissDeleteError={clearDeleteError}
                  onDismissRenameError={() => setRenameError(null)}
                  onDismissActionSuccess={() => setActionSuccess(null)}
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
