import { AccountTree } from './components/AccountTree'
import { useAccounts } from './hooks/useAccounts'

function App() {
  const { accounts, loading, error, reload } = useAccounts()

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
          <AccountTree accounts={accounts} />
        )}
      </div>
    </main>
  )
}

export default App
