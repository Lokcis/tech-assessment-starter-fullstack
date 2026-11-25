import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Ocurrió un error inesperado al renderizar la aplicación.',
    }
  }

  override componentDidCatch(_error: Error, _info: ErrorInfo) {
    // El error ya queda expuesto de forma visible en el estado de recuperación de la UI.
  }

  private readonly handleReload = () => {
    window.location.reload()
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell">
          <div className="card">
            <div className="status-banner status-banner--error" role="alert">
              <div className="status-banner__content">
                <p className="status-banner__title">Se produjo un error inesperado en la interfaz</p>
                <p className="status-banner__message">{this.state.message}</p>
              </div>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={this.handleReload}
              >
                Recargar aplicación
              </button>
            </div>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
