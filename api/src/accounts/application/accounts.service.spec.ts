import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { ACCOUNT_LEVELS, ACCOUNT_NATURES } from '../domain/account.types.js';
import { InMemoryAccountRepository } from '../infrastructure/in-memory-account.repository.js';
import { AccountsService } from './accounts.service.js';

describe('AccountsService', () => {
  let service: AccountsService;

  beforeEach(() => {
    service = new AccountsService(new InMemoryAccountRepository());
  });

  it('crea jerarquía completa (clase -> grupo -> cuenta -> subcuenta) heredando naturaleza', async () => {
    const clase = await service.create({
      code: '1',
      name: '  Activo  ',
      nature: ACCOUNT_NATURES.DEBITO,
    });
    expect(clase).toMatchObject({
      code: '1',
      name: 'Activo',
      level: ACCOUNT_LEVELS.CLASE,
      nature: ACCOUNT_NATURES.DEBITO,
      parentCode: null,
      allowsMovements: true,
      children: [],
    });

    const grupo = await service.create({ code: '11', name: 'Disponible' });
    expect(grupo.nature).toBe(ACCOUNT_NATURES.DEBITO);
    expect(grupo.parentCode).toBe('1');
    expect(grupo.level).toBe(ACCOUNT_LEVELS.GRUPO);

    const cuenta = await service.create({ code: '1105', name: 'Caja' });
    expect(cuenta.nature).toBe(ACCOUNT_NATURES.DEBITO);
    expect(cuenta.parentCode).toBe('11');
    expect(cuenta.level).toBe(ACCOUNT_LEVELS.CUENTA);

    const subcuenta = await service.create({
      code: '110505',
      name: 'Caja general',
    });
    expect(subcuenta.nature).toBe(ACCOUNT_NATURES.DEBITO);
    expect(subcuenta.parentCode).toBe('1105');
    expect(subcuenta.level).toBe(ACCOUNT_LEVELS.SUBCUENTA);

    const tree = await service.getTree();
    expect(tree).toHaveLength(1);
    expect(tree[0].allowsMovements).toBe(false);
    expect(tree[0].children[0].allowsMovements).toBe(false);
    expect(tree[0].children[0].children[0].allowsMovements).toBe(false);
    expect(tree[0].children[0].children[0].children[0].allowsMovements).toBe(
      true,
    );
  });

  it('rechaza código inválido, nombre vacío o clase sin naturaleza (400)', async () => {
    await expect(
      service.create({ code: '123', name: 'Inválida' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.create({ code: '1A', name: 'No numérica' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.create({
        code: '1',
        name: '   ',
        nature: ACCOUNT_NATURES.DEBITO,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(service.create({ code: '1', name: 'Activo' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rechaza códigos duplicados (409)', async () => {
    await service.create({
      code: '1',
      name: 'Activo',
      nature: ACCOUNT_NATURES.DEBITO,
    });

    await expect(
      service.create({
        code: '1',
        name: 'Otro Activo',
        nature: ACCOUNT_NATURES.DEBITO,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rechaza crear una cuenta cuyo padre no existe (422)', async () => {
    await expect(
      service.create({ code: '11', name: 'Disponible' }),
    ).rejects.toThrow(UnprocessableEntityException);

    await service.create({
      code: '1',
      name: 'Activo',
      nature: ACCOUNT_NATURES.DEBITO,
    });

    await expect(
      service.create({ code: '1105', name: 'Caja sin grupo 11' }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('rechaza naturaleza incompatible con la heredada del padre (422)', async () => {
    await service.create({
      code: '1',
      name: 'Activo',
      nature: ACCOUNT_NATURES.DEBITO,
    });

    await expect(
      service.create({
        code: '11',
        name: 'Disponible',
        nature: ACCOUNT_NATURES.CREDITO,
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('elimina cuentas hoja y reactiva allowsMovements en el padre; rechaza eliminar si tiene hijas o no existe', async () => {
    await expect(service.remove('9')).rejects.toThrow(NotFoundException);

    await service.create({
      code: '1',
      name: 'Activo',
      nature: ACCOUNT_NATURES.DEBITO,
    });
    await service.create({ code: '11', name: 'Disponible' });

    await expect(service.remove('1')).rejects.toThrow(ConflictException);

    await service.remove('11');

    const tree = await service.getTree();
    expect(tree).toHaveLength(1);
    expect(tree[0].code).toBe('1');
    expect(tree[0].allowsMovements).toBe(true);
    expect(tree[0].children).toEqual([]);
  });

  it('renombra una cuenta manteniendo nivel, naturaleza y estado de allowsMovements; rechaza nombre vacío (400) o inexistente (404)', async () => {
    await expect(
      service.rename('9', { name: 'Inexistente' }),
    ).rejects.toThrow(NotFoundException);

    await service.create({
      code: '1',
      name: 'Activo',
      nature: ACCOUNT_NATURES.DEBITO,
    });
    await service.create({ code: '11', name: 'Disponible' });

    await expect(service.rename('1', { name: '   ' })).rejects.toThrow(
      BadRequestException,
    );

    const renamedParent = await service.rename('1', {
      name: '  Activos corrientes y no corrientes  ',
    });
    expect(renamedParent).toMatchObject({
      code: '1',
      name: 'Activos corrientes y no corrientes',
      level: ACCOUNT_LEVELS.CLASE,
      nature: ACCOUNT_NATURES.DEBITO,
      parentCode: null,
      allowsMovements: false,
    });

    const renamedLeaf = await service.rename('11', {
      name: 'Efectivo y equivalentes',
    });
    expect(renamedLeaf).toMatchObject({
      code: '11',
      name: 'Efectivo y equivalentes',
      level: ACCOUNT_LEVELS.GRUPO,
      nature: ACCOUNT_NATURES.DEBITO,
      parentCode: '1',
      allowsMovements: true,
    });
  });
});
