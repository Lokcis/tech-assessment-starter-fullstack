import { describe, expect, it } from 'vitest';
import {
  IncompatibleAccountNatureError,
  InvalidAccountCodeError,
  MissingClassNatureError,
  isValidAccountCode,
  resolveAccountLevel,
  resolveAccountNature,
  resolveParentCode,
} from './account.rules.js';
import { ACCOUNT_LEVELS, ACCOUNT_NATURES } from './account.types.js';

describe('account.rules', () => {
  describe('resolveAccountLevel & isValidAccountCode', () => {
    it('resuelve el nivel según la longitud del código (1, 2, 4, 6 dígitos)', () => {
      expect(resolveAccountLevel('1')).toBe(ACCOUNT_LEVELS.CLASE);
      expect(resolveAccountLevel('11')).toBe(ACCOUNT_LEVELS.GRUPO);
      expect(resolveAccountLevel('1105')).toBe(ACCOUNT_LEVELS.CUENTA);
      expect(resolveAccountLevel('110505')).toBe(ACCOUNT_LEVELS.SUBCUENTA);
      expect(isValidAccountCode('110505')).toBe(true);
    });

    it('rechaza códigos con longitudes inválidas (0, 3, 5, 7)', () => {
      for (const invalid of ['', '110', '11050', '1105050']) {
        expect(isValidAccountCode(invalid)).toBe(false);
        expect(() => resolveAccountLevel(invalid)).toThrow(InvalidAccountCodeError);
      }
    });

    it('rechaza códigos con caracteres no numéricos', () => {
      for (const invalid of ['1A', '11-5', ' 1', '1.1', 'abcd']) {
        expect(isValidAccountCode(invalid)).toBe(false);
        expect(() => resolveAccountLevel(invalid)).toThrow(InvalidAccountCodeError);
      }
    });
  });

  describe('resolveParentCode', () => {
    it('calcula el padre por prefijo del nivel anterior', () => {
      expect(resolveParentCode('1')).toBeNull();
      expect(resolveParentCode('11')).toBe('1');
      expect(resolveParentCode('1105')).toBe('11');
      expect(resolveParentCode('110505')).toBe('1105');
    });

    it('lanza InvalidAccountCodeError si el código es inválido', () => {
      expect(() => resolveParentCode('123')).toThrow(InvalidAccountCodeError);
    });
  });

  describe('resolveAccountNature', () => {
    it('requiere naturaleza válida al crear una CLASE', () => {
      expect(
        resolveAccountNature(ACCOUNT_LEVELS.CLASE, ACCOUNT_NATURES.DEBITO, null),
      ).toBe(ACCOUNT_NATURES.DEBITO);
      expect(
        resolveAccountNature(ACCOUNT_LEVELS.CLASE, ACCOUNT_NATURES.CREDITO, null),
      ).toBe(ACCOUNT_NATURES.CREDITO);
      expect(() =>
        resolveAccountNature(ACCOUNT_LEVELS.CLASE, undefined, null),
      ).toThrow(MissingClassNatureError);
    });

    it('hereda automáticamente la naturaleza del padre para descendientes', () => {
      expect(
        resolveAccountNature(ACCOUNT_LEVELS.GRUPO, undefined, ACCOUNT_NATURES.DEBITO),
      ).toBe(ACCOUNT_NATURES.DEBITO);
      expect(
        resolveAccountNature(
          ACCOUNT_LEVELS.SUBCUENTA,
          ACCOUNT_NATURES.CREDITO,
          ACCOUNT_NATURES.CREDITO,
        ),
      ).toBe(ACCOUNT_NATURES.CREDITO);
    });

    it('rechaza naturaleza explícita distinta a la heredada del padre', () => {
      expect(() =>
        resolveAccountNature(
          ACCOUNT_LEVELS.CUENTA,
          ACCOUNT_NATURES.CREDITO,
          ACCOUNT_NATURES.DEBITO,
        ),
      ).toThrow(IncompatibleAccountNatureError);
    });
  });
});
