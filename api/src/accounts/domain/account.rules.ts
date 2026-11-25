import {
  ACCOUNT_LEVELS,
  ACCOUNT_NATURES,
  type AccountLevel,
  type AccountNature,
} from './account.types.js';

const NUMERIC_CODE_REGEX = /^\d+$/;

const LEVEL_BY_LENGTH: Readonly<Record<number, AccountLevel>> = {
  1: ACCOUNT_LEVELS.CLASE,
  2: ACCOUNT_LEVELS.GRUPO,
  4: ACCOUNT_LEVELS.CUENTA,
  6: ACCOUNT_LEVELS.SUBCUENTA,
};

const PARENT_LENGTH_BY_LENGTH: Readonly<Record<number, number | null>> = {
  1: null,
  2: 1,
  4: 2,
  6: 4,
};

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidAccountCodeError extends DomainError {}

export class MissingClassNatureError extends DomainError {}

export class IncompatibleAccountNatureError extends DomainError {}

export function isNumericCode(code: string): boolean {
  return NUMERIC_CODE_REGEX.test(code);
}

export function isValidAccountCode(code: string): boolean {
  return isNumericCode(code) && code.length in LEVEL_BY_LENGTH;
}

export function isValidAccountNature(value: unknown): value is AccountNature {
  return value === ACCOUNT_NATURES.DEBITO || value === ACCOUNT_NATURES.CREDITO;
}

export function resolveAccountLevel(code: string): AccountLevel {
  if (!isNumericCode(code)) {
    throw new InvalidAccountCodeError(
      `El código '${code}' debe contener únicamente dígitos numéricos.`,
    );
  }

  const level = LEVEL_BY_LENGTH[code.length];
  if (!level) {
    throw new InvalidAccountCodeError(
      `La longitud del código '${code}' (${code.length}) no es válida. Longitudes permitidas: 1 (clase), 2 (grupo), 4 (cuenta) o 6 (subcuenta).`,
    );
  }

  return level;
}

export function resolveParentCode(code: string): string | null {
  resolveAccountLevel(code);
  const parentLength = PARENT_LENGTH_BY_LENGTH[code.length];

  if (parentLength === null || parentLength === undefined) {
    return null;
  }

  return code.slice(0, parentLength);
}

export function resolveAccountNature(
  level: AccountLevel,
  requestedNature: AccountNature | undefined,
  parentNature: AccountNature | null,
): AccountNature {
  if (level === ACCOUNT_LEVELS.CLASE) {
    if (!requestedNature || !isValidAccountNature(requestedNature)) {
      throw new MissingClassNatureError(
        'Las cuentas de nivel CLASE requieren una naturaleza válida (DEBITO o CREDITO).',
      );
    }
    return requestedNature;
  }

  if (!parentNature) {
    throw new DomainError(
      'No se puede determinar la naturaleza heredada porque no existe la cuenta padre.',
    );
  }

  if (requestedNature !== undefined && requestedNature !== parentNature) {
    throw new IncompatibleAccountNatureError(
      `La naturaleza '${requestedNature}' no coincide con la naturaleza heredada del padre ('${parentNature}').`,
    );
  }

  return parentNature;
}
