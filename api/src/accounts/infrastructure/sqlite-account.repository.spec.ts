import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ACCOUNT_LEVELS,
  ACCOUNT_NATURES,
  type Account,
} from '../domain/account.types.js';
import { SqliteAccountRepository } from './sqlite-account.repository.js';

function makeAccount(
  code: string,
  name: string,
  level: Account['level'],
  nature: Account['nature'],
  parentCode: string | null,
): Account {
  return {
    code,
    name,
    level,
    nature,
    parentCode,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('SqliteAccountRepository', () => {
  let repository: SqliteAccountRepository;

  beforeEach(() => {
    repository = new SqliteAccountRepository(':memory:');
  });

  afterEach(() => {
    repository.close();
  });

  it('inserta y consulta cuentas por código', async () => {
    const clase = makeAccount('1', 'Activo', ACCOUNT_LEVELS.CLASE, ACCOUNT_NATURES.DEBITO, null);
    await repository.create(clase);

    const found = await repository.findByCode('1');
    expect(found).toEqual(clase);
    expect(await repository.findByCode('9')).toBeNull();
  });

  it('retorna las cuentas ordenadas ascendentemente por código', async () => {
    await repository.create(
      makeAccount('2', 'Pasivo', ACCOUNT_LEVELS.CLASE, ACCOUNT_NATURES.CREDITO, null),
    );
    await repository.create(
      makeAccount('1', 'Activo', ACCOUNT_LEVELS.CLASE, ACCOUNT_NATURES.DEBITO, null),
    );
    await repository.create(
      makeAccount('11', 'Disponible', ACCOUNT_LEVELS.GRUPO, ACCOUNT_NATURES.DEBITO, '1'),
    );

    const ordered = await repository.findAllOrdered();
    expect(ordered.map((account) => account.code)).toEqual(['1', '11', '2']);
  });

  it('detecta correctamente si una cuenta tiene hijas y permite eliminar hojas', async () => {
    await repository.create(
      makeAccount('1', 'Activo', ACCOUNT_LEVELS.CLASE, ACCOUNT_NATURES.DEBITO, null),
    );
    expect(await repository.hasChildren('1')).toBe(false);

    await repository.create(
      makeAccount('11', 'Disponible', ACCOUNT_LEVELS.GRUPO, ACCOUNT_NATURES.DEBITO, '1'),
    );
    expect(await repository.hasChildren('1')).toBe(true);
    expect(await repository.hasChildren('11')).toBe(false);

    await repository.deleteByCode('11');
    expect(await repository.findByCode('11')).toBeNull();
    expect(await repository.hasChildren('1')).toBe(false);
  });

  it('rechaza eliminar en BD una cuenta con hijas por ON DELETE RESTRICT', async () => {
    await repository.create(
      makeAccount('1', 'Activo', ACCOUNT_LEVELS.CLASE, ACCOUNT_NATURES.DEBITO, null),
    );
    await repository.create(
      makeAccount('11', 'Disponible', ACCOUNT_LEVELS.GRUPO, ACCOUNT_NATURES.DEBITO, '1'),
    );

    await expect(repository.deleteByCode('1')).rejects.toThrow();
  });

  it('rechaza códigos duplicados y padres inexistentes a nivel de BD', async () => {
    await repository.create(
      makeAccount('1', 'Activo', ACCOUNT_LEVELS.CLASE, ACCOUNT_NATURES.DEBITO, null),
    );

    await expect(
      repository.create(
        makeAccount('1', 'Activo Duplicado', ACCOUNT_LEVELS.CLASE, ACCOUNT_NATURES.DEBITO, null),
      ),
    ).rejects.toThrow();

    await expect(
      repository.create(
        makeAccount('21', 'Sin Padre', ACCOUNT_LEVELS.GRUPO, ACCOUNT_NATURES.CREDITO, '2'),
      ),
    ).rejects.toThrow();
  });

  it('actualiza solo el nombre de una cuenta existente sin modificar otros campos', async () => {
    const clase = makeAccount(
      '1',
      'Activo',
      ACCOUNT_LEVELS.CLASE,
      ACCOUNT_NATURES.DEBITO,
      null,
    );
    await repository.create(clase);

    const updated = await repository.updateName('1', 'Activos totales');
    expect(updated).toEqual({ ...clase, name: 'Activos totales' });
    expect(await repository.findByCode('1')).toEqual(updated);
  });
});
