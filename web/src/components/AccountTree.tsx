import { useMemo, useState } from 'react'
import { findAccountByCode } from '../domain/accountRules'
import { searchAccountTree } from '../domain/accountTreeSearch'
import type { DeleteErrorState } from '../hooks/useAccounts'
import type { AccountTreeNode } from '../types/account'
import { AccountTreeItem } from './AccountTreeItem'

interface AccountTreeProps {
  accounts: AccountTreeNode[]
  deletingCode: string | null
  renamingCode: string | null
  deleteError: DeleteErrorState | null
  renameError: DeleteErrorState | null
  actionSuccess: string | null
  onRequestCreateChild: (node: AccountTreeNode) => void
  onRename: (code: string, newName: string) => Promise<boolean>
  onRequestDelete: (node: AccountTreeNode) => void
  onDismissDeleteError: () => void
  onDismissRenameError: () => void
  onDismissActionSuccess: () => void
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
  renamingCode,
  deleteError,
  renameError,
  actionSuccess,
  onRequestCreateChild,
  onRename,
  onRequestDelete,
  onDismissDeleteError,
  onDismissRenameError,
  onDismissActionSuccess,
}: AccountTreeProps) {
  const [collapsedCodes, setCollapsedCodes] = useState<Set<string>>(() => new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchCollapsedCodes, setSearchCollapsedCodes] = useState<Set<string>>(() => new Set())
  const [editingCode, setEditingCode] = useState<string | null>(null)

  const { totalCount } = useMemo(() => collectStats(accounts), [accounts])

  const searchResult = useMemo(
    () => searchAccountTree(accounts, searchQuery),
    [accounts, searchQuery],
  )

  const visibleNodes = searchResult.nodes
  const { branchCodes: visibleBranchCodes } = useMemo(
    () => collectStats(visibleNodes),
    [visibleNodes],
  )

  const activeCollapsedCodes = searchResult.isSearching ? searchCollapsedCodes : collapsedCodes
  const hasExpandableNodes = visibleBranchCodes.length > 0
  const allCollapsed =
    hasExpandableNodes && visibleBranchCodes.every((code) => activeCollapsedCodes.has(code))
  const allExpanded =
    !hasExpandableNodes || visibleBranchCodes.every((code) => !activeCollapsedCodes.has(code))

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setSearchCollapsedCodes(new Set())
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchCollapsedCodes(new Set())
  }

  const handleToggle = (code: string) => {
    const updater = (prev: Set<string>) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    }

    if (searchResult.isSearching) {
      setSearchCollapsedCodes(updater)
    } else {
      setCollapsedCodes(updater)
    }
  }

  const handleRequestCreateChildNode = (node: AccountTreeNode) => {
    const fullNode = findAccountByCode(accounts, node.code) ?? node
    onRequestCreateChild(fullNode)
  }

  const handleRequestDeleteNode = (node: AccountTreeNode) => {
    const fullNode = findAccountByCode(accounts, node.code) ?? node
    onRequestDelete(fullNode)
  }

  const handleExpandAll = () => {
    if (searchResult.isSearching) {
      setSearchCollapsedCodes(new Set())
    } else {
      setCollapsedCodes(new Set())
    }
  }

  const handleCollapseAll = () => {
    if (searchResult.isSearching) {
      setSearchCollapsedCodes(new Set(visibleBranchCodes))
    } else {
      setCollapsedCodes(new Set(visibleBranchCodes))
    }
  }

  const handleStartRename = (node: AccountTreeNode) => {
    onDismissRenameError()
    onDismissDeleteError()
    onDismissActionSuccess()
    setEditingCode(node.code)
  }

  const handleCancelRename = () => {
    onDismissRenameError()
    setEditingCode(null)
  }

  const handleConfirmRename = async (code: string, newName: string) => {
    const renamed = await onRename(code, newName)
    if (renamed) {
      setEditingCode(null)
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="empty-state" role="status">
        {actionSuccess && (
          <div className="alert alert--success alert--dismissible tree-feedback" role="status">
            <span>{actionSuccess}</span>
            <button
              type="button"
              className="alert__close"
              onClick={onDismissActionSuccess}
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

      <div className="tree-search">
        <label htmlFor="account-tree-search" className="sr-only">
          Buscar cuentas por código o nombre
        </label>
        <div className="tree-search__control">
          <input
            id="account-tree-search"
            type="search"
            className="form-input tree-search__input"
            placeholder="Buscar por código o nombre (ej. 1105 o Caja)..."
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={handleClearSearch}
            >
              Limpiar
            </button>
          )}
        </div>
        {searchResult.isSearching && (
          <p className="tree-search__meta" role="status" aria-live="polite">
            {searchResult.matchCount === 0
              ? `Sin coincidencias para "${searchQuery.trim()}".`
              : `${searchResult.matchCount} ${
                  searchResult.matchCount === 1 ? 'coincidencia encontrada' : 'coincidencias encontradas'
                } (ramas abiertas automáticamente).`}
          </p>
        )}
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

      {renameError && (
        <div className="alert alert--error alert--dismissible tree-feedback" role="alert">
          <span>
            <strong>No se pudo renombrar la cuenta {renameError.code}:</strong> {renameError.message}
          </span>
          <button
            type="button"
            className="alert__close"
            onClick={onDismissRenameError}
            aria-label="Cerrar error"
          >
            ×
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="alert alert--success alert--dismissible tree-feedback" role="status" aria-live="polite">
          <span>{actionSuccess}</span>
          <button
            type="button"
            className="alert__close"
            onClick={onDismissActionSuccess}
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      )}

      {visibleNodes.length === 0 ? (
        <div className="empty-state" role="status">
          <p className="empty-state__title">No se encontraron cuentas</p>
          <p className="empty-state__description">
            Ninguna cuenta coincide con <code>{searchQuery.trim()}</code> por código o nombre.
          </p>
          <button
            type="button"
            className="btn btn--secondary btn--sm tree-empty-action"
            onClick={handleClearSearch}
          >
            Mostrar todo el catálogo
          </button>
        </div>
      ) : (
        <ul className="tree-root" role="tree" aria-label="Catálogo de cuentas contables">
          {visibleNodes.map((node) => (
            <AccountTreeItem
              key={node.code}
              node={node}
              depth={0}
              collapsedCodes={activeCollapsedCodes}
              isSearching={searchResult.isSearching}
              searchQuery={searchQuery}
              matchedCodes={searchResult.matchedCodes}
              deletingCode={deletingCode}
              renamingCode={renamingCode}
              editingCode={editingCode}
              deleteError={deleteError}
              renameError={renameError}
              onToggle={handleToggle}
              onRequestCreateChild={handleRequestCreateChildNode}
              onStartRename={handleStartRename}
              onCancelRename={handleCancelRename}
              onConfirmRename={handleConfirmRename}
              onRequestDelete={handleRequestDeleteNode}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
