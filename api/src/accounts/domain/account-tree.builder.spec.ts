import { describe, expect, it } from 'vitest';
import { buildAccountTree } from './account-tree.builder.js';
import {
  ACCOUNT_LEVELS,
  ACCOUNT_NATURES,
  type Account,
} from './account.types.js';

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

describe('buildAccountTree', () => {
  it('retorna arreglo vacío si no hay cuentas', () => {
    expect(buildAccountTree([])).toEqual([]);
  });

  it('arma el árbol anidado ordenado por código y calcula allowsMovements solo para hojas', () => {
    const accounts: Account[] = [
      makeAccount('110505', 'Caja general', ACCOUNT_LEVELS.SUBCUENTA, ACCOUNT_NATURES.DEBITO, '1105'),
      makeAccount('2', 'Pasivo', ACCOUNT_LEVELS.CLASE, ACCOUNT_NATURES.CREDITO, null),
      makeAccount('1105', 'Caja', ACCOUNT_LEVELS.CUENTA, ACCOUNT_NATURES.DEBITO, '11'),
      makeAccount('1110', 'Bancos', ACCOUNT_LEVELS.CUENTA, ACCOUNT_NATURES.DEBITO, '11'),
      makeAccount('1', 'Activo', ACCOUNT_LEVELS.CLASE, ACCOUNT_NATURES.DEBITO, null),
      makeAccount('11', 'Disponible', ACCOUNT_LEVELS.GRUPO, ACCOUNT_NATURES.DEBITO, '1'),
    ];

    const tree = buildAccountTree(accounts);

    expect(tree).toHaveLength(2);
    expect(tree[0].code).toBe('1');
    expect(tree[0].allowsMovements).toBe(false);
    expect(tree[1].code).toBe('2');
    expect(tree[1].allowsMovements).toBe(true);

    const grupo11 = tree[0].children[0];
    expect(grupo11.code).toBe('11');
    expect(grupo11.allowsMovements).toBe(false);
    expect(grupo11.children.map((c) => c.code)).toEqual(['1105', '1110']);

    const cuenta1105 = grupo11.children[0];
    expect(cuenta1105.allowsMovements).toBe(false);
    expect(cuenta1105.children).toHaveLength(1);
    expect(cuenta1105.children[0].code).toBe('110505');
    expect(cuenta1105.children[0].allowsMovements).toBe(true);

    const cuenta1110 = grupo11.children[1];
    expect(cuenta1110.allowsMovements).toBe(true);
    expect(cuenta1110.children).toEqual([]);
  });
});
