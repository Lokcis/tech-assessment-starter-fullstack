import type { Account } from './account.types.js';

export const ACCOUNT_REPOSITORY = Symbol.for('ACCOUNT_REPOSITORY');

export interface IAccountRepository {
  findAllOrdered(): Promise<Account[]>;
  findByCode(code: string): Promise<Account | null>;
  hasChildren(code: string): Promise<boolean>;
  create(account: Account): Promise<Account>;
  deleteByCode(code: string): Promise<void>;
}
