interface LoadingStateProps {
  message: string
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

interface RefreshingBarProps {
  message: string
}

export function RefreshingBar({ message }: RefreshingBarProps) {
  return (
    <div className="refresh-bar" role="status" aria-live="polite">
      <span className="spinner spinner--sm" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

interface ErrorBannerProps {
  title: string
  message: string
  onRetry?: () => void
  retrying?: boolean
}

export function ErrorBanner({
  title,
  message,
  onRetry,
  retrying = false,
}: ErrorBannerProps) {
  return (
    <div className="status-banner status-banner--error" role="alert">
      <div className="status-banner__content">
        <p className="status-banner__title">{title}</p>
        <p className="status-banner__message">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying ? 'Reintentando...' : 'Reintentar'}
        </button>
      )}
    </div>
  )
}
