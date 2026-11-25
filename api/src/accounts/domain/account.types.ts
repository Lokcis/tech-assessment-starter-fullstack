export const ACCOUNT_LEVELS = {
  CLASE: 'CLASE',
  GRUPO: 'GRUPO',
  CUENTA: 'CUENTA',
  SUBCUENTA: 'SUBCUENTA',
} as const;

export type AccountLevel = (typeof ACCOUNT_LEVELS)[keyof typeof ACCOUNT_LEVELS];

export const ACCOUNT_NATURES = {
  DEBITO: 'DEBITO',
  CREDITO: 'CREDITO',
} as const;

export type AccountNature = (typeof ACCOUNT_NATURES)[keyof typeof ACCOUNT_NATURES];

export interface Account {
  code: string;
  name: string;
  level: AccountLevel;
  nature: AccountNature;
  parentCode: string | null;
  createdAt: string;
}

export interface AccountTreeNode {
  code: string;
  name: string;
  level: AccountLevel;
  nature: AccountNature;
  parentCode: string | null;
  allowsMovements: boolean;
  children: AccountTreeNode[];
}
