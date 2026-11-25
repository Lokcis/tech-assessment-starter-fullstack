import type { AccountTreeNode, CreateAccountDto } from '../types/account'
import { httpRequest } from './httpClient'

export function getAccountsTree(signal?: AbortSignal): Promise<AccountTreeNode[]> {
  return httpRequest<AccountTreeNode[]>('/accounts', {
    method: 'GET',
    signal,
  })
}

export function createAccount(dto: CreateAccountDto): Promise<AccountTreeNode> {
  return httpRequest<AccountTreeNode>('/accounts', {
    method: 'POST',
    body: dto,
  })
}

export function deleteAccount(code: string): Promise<void> {
  return httpRequest<void>(`/accounts/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  })
}
