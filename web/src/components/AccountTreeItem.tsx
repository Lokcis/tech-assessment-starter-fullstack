import type { DeleteErrorState } from '../hooks/useAccounts'
import type { AccountLevel, AccountTreeNode } from '../types/account'

interface AccountTreeItemProps {
  node: AccountTreeNode
  depth: number
  collapsedCodes: ReadonlySet<string>
  deletingCode: string | null
  deleteError: DeleteErrorState | null
  onToggle: (code: string) => void
  onRequestDelete: (node: AccountTreeNode) => void
}

const LEVEL_LABELS: Record<AccountLevel, string> = {
  CLASE: 'Clase',
  GRUPO: 'Grupo',
  CUENTA: 'Cuenta',
  SUBCUENTA: 'Subcuenta',
}

export function AccountTreeItem({
  node,
  depth,
  collapsedCodes,
  deletingCode,
  deleteError,
  onToggle,
  onRequestDelete,
}: AccountTreeItemProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = !collapsedCodes.has(node.code)
  const isDeleting = deletingCode === node.code
  const isBusy = deletingCode !== null
  const nodeError = deleteError?.code === node.code ? deleteError.message : null

  return (
    <li className="tree-item" role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        className={`tree-row tree-row--level-${node.level.toLowerCase()} ${nodeError ? 'tree-row--has-error' : ''}`}
        style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
      >
        <div className="tree-row__main">
          {hasChildren ? (
            <button
              type="button"
              className="tree-toggle"
              onClick={() => onToggle(node.code)}
              aria-label={
                isExpanded
                  ? `Colapsar cuenta ${node.code} ${node.name}`
                  : `Expandir cuenta ${node.code} ${node.name}`
              }
              title={isExpanded ? 'Colapsar' : 'Expandir'}
            >
              <span className={`tree-toggle__icon ${isExpanded ? 'is-expanded' : ''}`} aria-hidden="true">
                ▸
              </span>
            </button>
          ) : (
            <span className="tree-leaf-marker" aria-hidden="true">
              •
            </span>
          )}

          <code className="tree-code">{node.code}</code>
          <span className="tree-name">{node.name}</span>
        </div>

        <div className="tree-row__meta">
          <span className={`badge badge--level-${node.level.toLowerCase()}`}>
            {LEVEL_LABELS[node.level]}
          </span>
          <span className={`badge badge--nature-${node.nature.toLowerCase()}`}>
            {node.nature === 'DEBITO' ? 'Débito' : 'Crédito'}
          </span>
          {node.allowsMovements && (
            <span className="badge badge--movements" title="Cuenta hoja: admite movimientos contables">
              Admite movimientos
            </span>
          )}
          <button
            type="button"
            className="btn btn--danger-ghost btn--sm"
            onClick={() => onRequestDelete(node)}
            disabled={isBusy}
            aria-label={`Eliminar cuenta ${node.code} ${node.name}`}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>

      {nodeError && (
        <div
          className="tree-row-error"
          role="alert"
          style={{ paddingLeft: `${depth * 1.5 + 2.9}rem` }}
        >
          {nodeError}
        </div>
      )}

      {hasChildren && isExpanded && (
        <ul className="tree-children" role="group">
          {node.children.map((child) => (
            <AccountTreeItem
              key={child.code}
              node={child}
              depth={depth + 1}
              collapsedCodes={collapsedCodes}
              deletingCode={deletingCode}
              deleteError={deleteError}
              onToggle={onToggle}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
