import type {
  AccountTreeNode,
  CreateAccountDto,
  RenameAccountDto,
} from '../types/account'
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

export function renameAccount(
  code: string,
  dto: RenameAccountDto,
): Promise<AccountTreeNode> {
  return httpRequest<AccountTreeNode>(`/accounts/${encodeURIComponent(code)}`, {
    method: 'PATCH',
    body: dto,
  })
}

export function deleteAccount(code: string): Promise<void> {
  return httpRequest<void>(`/accounts/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  })
}
