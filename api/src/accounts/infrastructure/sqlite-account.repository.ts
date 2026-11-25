import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { OnModuleDestroy } from '@nestjs/common';
import type { IAccountRepository } from '../domain/account.repository.js';
import type {
  Account,
  AccountLevel,
  AccountNature,
} from '../domain/account.types.js';

interface AccountRow {
  code: string;
  name: string;
  level: AccountLevel;
  nature: AccountNature;
  parent_code: string | null;
  created_at: string;
}

const INIT_SCHEMA_SQL = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS accounts (
    code        VARCHAR(6)   PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    level       VARCHAR(10)  NOT NULL CHECK (level IN ('CLASE', 'GRUPO', 'CUENTA', 'SUBCUENTA')),
    nature      VARCHAR(10)  NOT NULL CHECK (nature IN ('DEBITO', 'CREDITO')),
    parent_code VARCHAR(6)   NULL,
    created_at  TEXT         NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT fk_accounts_parent
      FOREIGN KEY (parent_code)
      REFERENCES accounts(code)
      ON DELETE RESTRICT
      ON UPDATE RESTRICT,
    CONSTRAINT chk_accounts_code_length
      CHECK (length(code) IN (1, 2, 4, 6)),
    CONSTRAINT chk_accounts_parent_by_level
      CHECK (
        (level = 'CLASE' AND parent_code IS NULL)
        OR (level <> 'CLASE' AND parent_code IS NOT NULL)
      )
  );

  CREATE INDEX IF NOT EXISTS idx_accounts_parent_code
    ON accounts(parent_code);
`;

function mapRowToAccount(row: AccountRow): Account {
  return {
    code: row.code,
    name: row.name,
    level: row.level,
    nature: row.nature,
    parentCode: row.parent_code,
    createdAt: row.created_at,
  };
}

export class SqliteAccountRepository
  implements IAccountRepository, OnModuleDestroy
{
  private readonly db: DatabaseSync;
  private closed = false;

  constructor(
    dbPath: string = process.env.ACCOUNTS_DB_PATH ??
      join(process.cwd(), 'data', 'catalog.db'),
  ) {
    if (dbPath !== ':memory:') {
      mkdirSync(dirname(dbPath), { recursive: true });
    }

    this.db = new DatabaseSync(dbPath);
    this.db.exec(INIT_SCHEMA_SQL);
  }

  async findAllOrdered(): Promise<Account[]> {
    const stmt = this.db.prepare(
      'SELECT code, name, level, nature, parent_code, created_at FROM accounts ORDER BY code ASC',
    );
    const rows = stmt.all() as unknown as AccountRow[];
    return rows.map(mapRowToAccount);
  }

  async findByCode(code: string): Promise<Account | null> {
    const stmt = this.db.prepare(
      'SELECT code, name, level, nature, parent_code, created_at FROM accounts WHERE code = ?',
    );
    const row = stmt.get(code) as unknown as AccountRow | undefined;
    return row ? mapRowToAccount(row) : null;
  }

  async hasChildren(code: string): Promise<boolean> {
    const stmt = this.db.prepare(
      'SELECT 1 AS found FROM accounts WHERE parent_code = ? LIMIT 1',
    );
    const row = stmt.get(code);
    return row !== undefined;
  }

  async create(account: Account): Promise<Account> {
    const stmt = this.db.prepare(
      'INSERT INTO accounts (code, name, level, nature, parent_code, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    );
    stmt.run(
      account.code,
      account.name,
      account.level,
      account.nature,
      account.parentCode,
      account.createdAt,
    );
    return { ...account };
  }

  async deleteByCode(code: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM accounts WHERE code = ?');
    stmt.run(code);
  }

  close(): void {
    if (!this.closed) {
      this.db.close();
      this.closed = true;
    }
  }

  onModuleDestroy(): void {
    this.close();
  }
}
