import { useMemo, useState } from 'react'
import type { AccountTreeNode } from '../types/account'
import { AccountTreeItem } from './AccountTreeItem'

interface AccountTreeProps {
  accounts: AccountTreeNode[]
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

export function AccountTree({ accounts }: AccountTreeProps) {
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

      <ul className="tree-root" role="tree" aria-label="Catálogo de cuentas contables">
        {accounts.map((node) => (
          <AccountTreeItem
            key={node.code}
            node={node}
            depth={0}
            collapsedCodes={collapsedCodes}
            onToggle={handleToggle}
          />
        ))}
      </ul>
    </section>
  )
}
