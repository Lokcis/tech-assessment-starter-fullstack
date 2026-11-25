import type { IAccountRepository } from '../domain/account.repository.js';
import type { Account } from '../domain/account.types.js';

export class InMemoryAccountRepository implements IAccountRepository {
  private readonly store = new Map<string, Account>();

  async findAllOrdered(): Promise<Account[]> {
    return Array.from(this.store.values())
      .map((account) => ({ ...account }))
      .sort((left, right) => left.code.localeCompare(right.code));
  }

  async findByCode(code: string): Promise<Account | null> {
    const account = this.store.get(code);
    return account ? { ...account } : null;
  }

  async hasChildren(code: string): Promise<boolean> {
    for (const account of this.store.values()) {
      if (account.parentCode === code) {
        return true;
      }
    }
    return false;
  }

  async create(account: Account): Promise<Account> {
    const copy = { ...account };
    this.store.set(account.code, copy);
    return { ...copy };
  }

  async updateName(code: string, name: string): Promise<Account> {
    const existing = this.store.get(code);
    if (!existing) {
      throw new Error(`No se encontró la cuenta '${code}' al actualizar.`);
    }

    const updated: Account = { ...existing, name };
    this.store.set(code, updated);
    return { ...updated };
  }

  async deleteByCode(code: string): Promise<void> {
    this.store.delete(code);
  }
}
