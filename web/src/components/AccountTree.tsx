import { useMemo, useState } from 'react'
import type { DeleteErrorState } from '../hooks/useAccounts'
import type { AccountTreeNode } from '../types/account'
import { AccountTreeItem } from './AccountTreeItem'

interface AccountTreeProps {
  accounts: AccountTreeNode[]
  deletingCode: string | null
  deleteError: DeleteErrorState | null
  deleteSuccess: string | null
  onRequestDelete: (node: AccountTreeNode) => void
  onDismissDeleteError: () => void
  onDismissDeleteSuccess: () => void
}

function collectStats(nodes: AccountTreeNode[]): {
  totalCount: number
  branchCodes: string[]
} {
  let totalCount = 0
  const branchCodes: string[] = []

  const walk = (list: AccountTreeNode[]) => {
    for (const node of list) {
      totalCount += 1
      if (node.children.length > 0) {
        branchCodes.push(node.code)
        walk(node.children)
      }
    }
  }

  walk(nodes)
  return { totalCount, branchCodes }
}

export function AccountTree({
  accounts,
  deletingCode,
  deleteError,
  deleteSuccess,
  onRequestDelete,
  onDismissDeleteError,
  onDismissDeleteSuccess,
}: AccountTreeProps) {
  const [collapsedCodes, setCollapsedCodes] = useState<Set<string>>(() => new Set())

  const { totalCount, branchCodes } = useMemo(() => collectStats(accounts), [accounts])
  const hasExpandableNodes = branchCodes.length > 0
  const allCollapsed = hasExpandableNodes && branchCodes.every((code) => collapsedCodes.has(code))
  const allExpanded = !hasExpandableNodes || branchCodes.every((code) => !collapsedCodes.has(code))

  const handleToggle = (code: string) => {
    setCollapsedCodes((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }

  const handleExpandAll = () => {
    setCollapsedCodes(new Set())
  }

  const handleCollapseAll = () => {
    setCollapsedCodes(new Set(branchCodes))
  }

  if (accounts.length === 0) {
    return (
      <div className="empty-state" role="status">
        {deleteSuccess && (
          <div className="alert alert--success alert--dismissible tree-feedback" role="status">
            <span>{deleteSuccess}</span>
            <button
              type="button"
              className="alert__close"
              onClick={onDismissDeleteSuccess}
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </div>
        )}
        <p className="empty-state__title">El catálogo de cuentas está vacío</p>
        <p className="empty-state__description">
          Aún no existen cuentas registradas. Crea una clase de 1 dígito (por ejemplo, <code>1</code> — Activo) para comenzar la jerarquía.
        </p>
      </div>
    )
  }

  return (
    <section className="tree-panel" aria-label="Árbol del catálogo de cuentas">
      <div className="tree-toolbar">
        <div className="tree-toolbar__summary">
          <strong>{totalCount}</strong> {totalCount === 1 ? 'cuenta registrada' : 'cuentas registradas'}
        </div>

        <div className="tree-toolbar__actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={handleExpandAll}
            disabled={allExpanded}
          >
            Expandir todo
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={handleCollapseAll}
            disabled={allCollapsed || !hasExpandableNodes}
          >
            Colapsar todo
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="alert alert--error alert--dismissible tree-feedback" role="alert">
          <span>
            <strong>No se pudo eliminar la cuenta {deleteError.code}:</strong> {deleteError.message}
          </span>
          <button
            type="button"
            className="alert__close"
            onClick={onDismissDeleteError}
            aria-label="Cerrar error"
          >
            ×
          </button>
        </div>
      )}

      {deleteSuccess && (
        <div className="alert alert--success alert--dismissible tree-feedback" role="status" aria-live="polite">
          <span>{deleteSuccess}</span>
          <button
            type="button"
            className="alert__close"
            onClick={onDismissDeleteSuccess}
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      )}

      <ul className="tree-root" role="tree" aria-label="Catálogo de cuentas contables">
        {accounts.map((node) => (
          <AccountTreeItem
            key={node.code}
            node={node}
            depth={0}
            collapsedCodes={collapsedCodes}
            deletingCode={deletingCode}
            deleteError={deleteError}
            onToggle={handleToggle}
            onRequestDelete={onRequestDelete}
          />
        ))}
      </ul>
    </section>
  )
}
