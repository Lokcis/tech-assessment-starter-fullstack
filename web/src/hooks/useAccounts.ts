import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import {
  createAccount,
  deleteAccount,
  getAccountsTree,
  renameAccount,
} from '../services/accountsApi'
import { ApiError } from '../services/httpClient'
import type { AccountTreeNode, CreateAccountDto } from '../types/account'

export const ACCOUNTS_QUERY_KEY = ['accounts'] as const

export interface DeleteErrorState {
  code: string
  message: string
}

export interface UseAccountsResult {
  accounts: AccountTreeNode[]
  loading: boolean
  refreshing: boolean
  creating: boolean
  renamingCode: string | null
  deletingCode: string | null
  error: string | null
  deleteError: DeleteErrorState | null
  reload: () => Promise<void>
  create: (dto: CreateAccountDto) => Promise<AccountTreeNode>
  rename: (code: string, name: string) => Promise<AccountTreeNode>
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
  const queryClient = useQueryClient()
  const [deleteError, setDeleteError] = useState<DeleteErrorState | null>(null)

  const accountsQuery = useQuery<AccountTreeNode[]>({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: ({ signal }) => getAccountsTree(signal),
  })

  const createMutation = useMutation({
    mutationFn: (dto: CreateAccountDto) => createAccount(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
    },
  })

  const renameMutation = useMutation({
    mutationFn: ({ code, name }: { code: string; name: string }) =>
      renameAccount(code, { name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (code: string) => deleteAccount(code),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
    },
  })

  const reload = useCallback(async () => {
    await accountsQuery.refetch()
  }, [accountsQuery])

  const create = useCallback(
    async (dto: CreateAccountDto): Promise<AccountTreeNode> => {
      setDeleteError(null)
      return createMutation.mutateAsync(dto)
    },
    [createMutation],
  )

  const rename = useCallback(
    async (code: string, name: string): Promise<AccountTreeNode> => {
      setDeleteError(null)
      return renameMutation.mutateAsync({ code, name })
    },
    [renameMutation],
  )

  const remove = useCallback(
    async (code: string): Promise<boolean> => {
      setDeleteError(null)
      try {
        await deleteMutation.mutateAsync(code)
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
      }
    },
    [deleteMutation],
  )

  const clearDeleteError = useCallback(() => {
    setDeleteError(null)
  }, [])

  const error = accountsQuery.error
    ? getErrorMessage(
        accountsQuery.error,
        'Ocurrió un error inesperado al cargar el catálogo de cuentas.',
      )
    : null

  return {
    accounts: accountsQuery.data ?? [],
    loading: accountsQuery.isPending,
    refreshing: accountsQuery.isFetching && !accountsQuery.isPending,
    creating: createMutation.isPending,
    renamingCode: renameMutation.isPending ? (renameMutation.variables?.code ?? null) : null,
    deletingCode: deleteMutation.isPending ? (deleteMutation.variables ?? null) : null,
    error,
    deleteError,
    reload,
    create,
    rename,
    remove,
    clearDeleteError,
  }
}
