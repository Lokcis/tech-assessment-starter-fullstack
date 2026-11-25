export type AccountLevel = 'CLASE' | 'GRUPO' | 'CUENTA' | 'SUBCUENTA'

export type AccountNature = 'DEBITO' | 'CREDITO'

export interface AccountTreeNode {
  code: string
  name: string
  level: AccountLevel
  nature: AccountNature
  parentCode: string | null
  allowsMovements: boolean
  children: AccountTreeNode[]
}

export interface CreateAccountDto {
  code: string
  name: string
  nature?: AccountNature
}

export interface ApiErrorPayload {
  statusCode?: number
  message?: string | string[]
  error?: string
}
