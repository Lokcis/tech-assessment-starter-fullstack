import { useCallback, useEffect, useState } from 'react'
import { createAccount, deleteAccount, getAccountsTree } from '../services/accountsApi'
import { ApiError } from '../services/httpClient'
import type { AccountTreeNode, CreateAccountDto } from '../types/account'

export interface DeleteErrorState {
  code: string
  message: string
}

export interface UseAccountsResult {
  accounts: AccountTreeNode[]
  loading: boolean
  creating: boolean
  deletingCode: string | null
  error: string | null
  deleteError: DeleteErrorState | null
  reload: () => Promise<void>
  create: (dto: CreateAccountDto) => Promise<AccountTreeNode>
  remove: (code: string) => Promise<boolean>
  clearDeleteError: () => void
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.message
  }
  if (err instanceof Error) {
    return err.message
  }
  return fallback
}

export function useAccounts(): UseAccountsResult {
  const [accounts, setAccounts] = useState<AccountTreeNode[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [creating, setCreating] = useState<boolean>(false)
  const [deletingCode, setDeletingCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<DeleteErrorState | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    getAccountsTree(controller.signal)
      .then((data) => {
        setAccounts(data)
        setError(null)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        setError(
          getErrorMessage(err, 'Ocurrió un error inesperado al cargar el catálogo de cuentas.'),
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAccountsTree()
      setAccounts(data)
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, 'Ocurrió un error inesperado al cargar el catálogo de cuentas.'),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (dto: CreateAccountDto): Promise<AccountTreeNode> => {
    setCreating(true)
    setDeleteError(null)
    try {
      const created = await createAccount(dto)
      try {
        const updatedTree = await getAccountsTree()
        setAccounts(updatedTree)
        setError(null)
      } catch (refreshErr: unknown) {
        setError(
          getErrorMessage(refreshErr, 'La cuenta fue creada, pero falló la recarga del catálogo.'),
        )
      }
      return created
    } finally {
      setCreating(false)
    }
  }, [])

  const remove = useCallback(async (code: string): Promise<boolean> => {
    setDeletingCode(code)
    setDeleteError(null)
    try {
      await deleteAccount(code)
      try {
        const updatedTree = await getAccountsTree()
        setAccounts(updatedTree)
        setError(null)
      } catch (refreshErr: unknown) {
        setError(
          getErrorMessage(refreshErr, 'La cuenta fue eliminada, pero falló la recarga del catálogo.'),
        )
      }
      return true
    } catch (err: unknown) {
      setDeleteError({
        code,
        message: getErrorMessage(
          err,
          `No se pudo eliminar la cuenta "${code}". Intenta nuevamente.`,
        ),
      })
      return false
    } finally {
      setDeletingCode(null)
    }
  }, [])

  const clearDeleteError = useCallback(() => {
    setDeleteError(null)
  }, [])

  return {
    accounts,
    loading,
    creating,
    deletingCode,
    error,
    deleteError,
    reload,
    create,
    remove,
    clearDeleteError,
  }
}
