import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { getHighlightSegments } from '../domain/accountTreeSearch'
import type { DeleteErrorState } from '../hooks/useAccounts'
import type { AccountLevel, AccountTreeNode } from '../types/account'

interface AccountTreeItemProps {
  node: AccountTreeNode
  depth: number
  collapsedCodes: ReadonlySet<string>
  isSearching: boolean
  searchQuery: string
  matchedCodes: ReadonlySet<string>
  deletingCode: string | null
  renamingCode: string | null
  editingCode: string | null
  deleteError: DeleteErrorState | null
  renameError: DeleteErrorState | null
  onToggle: (code: string) => void
  onRequestCreateChild: (node: AccountTreeNode) => void
  onStartRename: (node: AccountTreeNode) => void
  onCancelRename: () => void
  onConfirmRename: (code: string, newName: string) => Promise<void>
  onRequestDelete: (node: AccountTreeNode) => void
}

const LEVEL_LABELS: Record<AccountLevel, string> = {
  CLASE: 'CLASE',
  GRUPO: 'GRUPO',
  CUENTA: 'CUENTA',
  SUBCUENTA: 'SUBCUENTA',
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return <>{text}</>
  }

  const segments = getHighlightSegments(text, query)
  return (
    <>
      {segments.map((segment, index) =>
        segment.highlighted ? (
          <mark key={`${index}-${segment.text}`} className="tree-highlight">
            {segment.text}
          </mark>
        ) : (
          <span key={`${index}-${segment.text}`}>{segment.text}</span>
        ),
      )}
    </>
  )
}

export function AccountTreeItem({
  node,
  depth,
  collapsedCodes,
  isSearching,
  searchQuery,
  matchedCodes,
  deletingCode,
  renamingCode,
  editingCode,
  deleteError,
  renameError,
  onToggle,
  onRequestCreateChild,
  onStartRename,
  onCancelRename,
  onConfirmRename,
  onRequestDelete,
}: AccountTreeItemProps) {
  const hasChildren = node.children.length > 0
  const canHaveChildren = node.level !== 'SUBCUENTA'
  const isExpanded = !collapsedCodes.has(node.code)
  const isMatched = isSearching && matchedCodes.has(node.code)
  const isDeleting = deletingCode === node.code
  const isRenaming = renamingCode === node.code
  const isEditing = editingCode === node.code
  const isBusy = deletingCode !== null || renamingCode !== null

  const [wasEditing, setWasEditing] = useState(false)
  const [draftName, setDraftName] = useState(node.name)
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  if (isEditing !== wasEditing) {
    setWasEditing(isEditing)
    if (isEditing) {
      setDraftName(node.name)
      setLocalError(null)
    }
  }

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const nodeDeleteError = deleteError?.code === node.code ? deleteError.message : null
  const nodeRenameError = renameError?.code === node.code ? renameError.message : null
  const nodeError = localError ?? nodeRenameError ?? nodeDeleteError

  const handleRenameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = draftName.trim()

    if (!trimmed) {
      setLocalError('El nombre de la cuenta es obligatorio.')
      return
    }
    if (trimmed.length > 150) {
      setLocalError('El nombre no puede superar los 150 caracteres.')
      return
    }
    if (trimmed === node.name) {
      setLocalError(null)
      onCancelRename()
      return
    }

    setLocalError(null)
    await onConfirmRename(node.code, trimmed)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && !isRenaming) {
      event.preventDefault()
      setLocalError(null)
      onCancelRename()
    }
  }

  return (
    <li className="tree-item" role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        className={`tree-row tree-row--level-${node.level.toLowerCase()} ${
          isMatched ? 'tree-row--matched' : ''
        } ${nodeError ? 'tree-row--has-error' : ''}`}
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
              <span
                className={`tree-toggle__icon ${isExpanded ? 'is-expanded' : ''}`}
                aria-hidden="true"
              >
                ▸
              </span>
            </button>
          ) : (
            <span className="tree-leaf-marker" aria-hidden="true">
              •
            </span>
          )}

          <code className="tree-code">
            <HighlightedText text={node.code} query={searchQuery} />
          </code>

          {isEditing ? (
            <form
              className="tree-rename-form"
              onSubmit={(event) => void handleRenameSubmit(event)}
              noValidate
            >
              <input
                ref={inputRef}
                type="text"
                maxLength={150}
                value={draftName}
                onChange={(event) => {
                  setDraftName(event.target.value)
                  if (localError) {
                    setLocalError(null)
                  }
                }}
                onKeyDown={handleKeyDown}
                disabled={isRenaming}
                className={`form-input form-input--sm ${localError || nodeRenameError ? 'is-invalid' : ''}`}
                aria-label={`Nuevo nombre para la cuenta ${node.code}`}
                aria-invalid={Boolean(localError || nodeRenameError)}
              />
              <button
                type="submit"
                className="btn btn--primary btn--sm"
                disabled={isRenaming}
              >
                {isRenaming ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => {
                  setLocalError(null)
                  onCancelRename()
                }}
                disabled={isRenaming}
              >
                Cancelar
              </button>
            </form>
          ) : (
            <span className="tree-name">
              <HighlightedText text={node.name} query={searchQuery} />
            </span>
          )}
        </div>

        <div className="tree-row__meta">
          <span
            className={`badge badge--level-${node.level.toLowerCase()}`}
            title={`Nivel: ${LEVEL_LABELS[node.level]}`}
          >
            {LEVEL_LABELS[node.level]}
          </span>
          <span
            className={`badge badge--nature-${node.nature.toLowerCase()}`}
            title={`Naturaleza: ${node.nature === 'DEBITO' ? 'Débito' : 'Crédito'}`}
          >
            {node.nature === 'DEBITO' ? 'DEBITO' : 'CREDITO'}
          </span>
          {node.allowsMovements && (
            <span className="badge badge--movements" title="Cuenta hoja: admite movimientos contables">
              Admite movimientos
            </span>
          )}

          {!isEditing && (
            <div className="tree-row__actions">
              {canHaveChildren && (
                <button
                  type="button"
                  className="btn btn--ghost-primary btn--sm"
                  onClick={() => onRequestCreateChild(node)}
                  disabled={isBusy}
                  aria-label={`Crear cuenta hija de ${node.code} ${node.name}`}
                  title={`Crear cuenta hija bajo ${node.code}`}
                >
                  + Hija
                </button>
              )}
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => onStartRename(node)}
                disabled={isBusy}
                aria-label={`Renombrar cuenta ${node.code} ${node.name}`}
                title="Renombrar cuenta"
              >
                Renombrar
              </button>
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
          )}
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
              isSearching={isSearching}
              searchQuery={searchQuery}
              matchedCodes={matchedCodes}
              deletingCode={deletingCode}
              renamingCode={renamingCode}
              editingCode={editingCode}
              deleteError={deleteError}
              renameError={renameError}
              onToggle={onToggle}
              onRequestCreateChild={onRequestCreateChild}
              onStartRename={onStartRename}
              onCancelRename={onCancelRename}
              onConfirmRename={onConfirmRename}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
