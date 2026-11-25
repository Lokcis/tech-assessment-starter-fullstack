import { useCallback, useEffect, useState } from 'react'
import { getAccountsTree } from '../services/accountsApi'
import { ApiError } from '../services/httpClient'
import type { AccountTreeNode } from '../types/account'

export interface UseAccountsResult {
  accounts: AccountTreeNode[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Ocurrió un error inesperado al cargar el catálogo de cuentas.'
}

export function useAccounts(): UseAccountsResult {
  const [accounts, setAccounts] = useState<AccountTreeNode[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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
        setError(getErrorMessage(err))
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
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    accounts,
    loading,
    error,
    reload,
  }
}
