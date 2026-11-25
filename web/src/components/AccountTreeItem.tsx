import type { AccountLevel, AccountTreeNode } from '../types/account'

interface AccountTreeItemProps {
  node: AccountTreeNode
  depth: number
  collapsedCodes: ReadonlySet<string>
  onToggle: (code: string) => void
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
  onToggle,
}: AccountTreeItemProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = !collapsedCodes.has(node.code)

  return (
    <li className="tree-item" role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        className={`tree-row tree-row--level-${node.level.toLowerCase()}`}
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
        </div>
      </div>

      {hasChildren && isExpanded && (
        <ul className="tree-children" role="group">
          {node.children.map((child) => (
            <AccountTreeItem
              key={child.code}
              node={child}
              depth={depth + 1}
              collapsedCodes={collapsedCodes}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
