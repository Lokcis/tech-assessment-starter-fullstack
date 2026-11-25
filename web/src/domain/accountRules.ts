import type { ApiError } from '../services/httpClient'
import type { AccountLevel, AccountNature, AccountTreeNode } from '../types/account'

export interface CreateAccountFormValues {
  code: string
  name: string
  nature: AccountNature | ''
}

export interface CreateAccountFieldErrors {
  code?: string
  name?: string
  nature?: string
  general?: string
}

const DIGITS_ONLY_REGEX = /^\d+$/

export function resolveLevel(code: string): AccountLevel | null {
  if (!DIGITS_ONLY_REGEX.test(code)) {
    return null
  }
  switch (code.length) {
    case 1:
      return 'CLASE'
    case 2:
      return 'GRUPO'
    case 4:
      return 'CUENTA'
    case 6:
      return 'SUBCUENTA'
    default:
      return null
  }
}

export function resolveParentCode(code: string): string | null {
  if (!DIGITS_ONLY_REGEX.test(code)) {
    return null
  }
  switch (code.length) {
    case 6:
      return code.slice(0, 4)
    case 4:
      return code.slice(0, 2)
    case 2:
      return code.slice(0, 1)
    default:
      return null
  }
}

export function findAccountByCode(
  nodes: AccountTreeNode[],
  code: string,
): AccountTreeNode | null {
  for (const node of nodes) {
    if (node.code === code) {
      return node
    }
    const found = findAccountByCode(node.children, code)
    if (found) {
      return found
    }
  }
  return null
}

export function validateCreateAccountForm(
  values: CreateAccountFormValues,
  accounts: AccountTreeNode[],
): CreateAccountFieldErrors {
  const errors: CreateAccountFieldErrors = {}
  const trimmedCode = values.code.trim()
  const trimmedName = values.name.trim()

  if (!trimmedCode) {
    errors.code = 'El código de la cuenta es obligatorio.'
  } else if (!DIGITS_ONLY_REGEX.test(trimmedCode)) {
    errors.code = 'El código debe contener únicamente dígitos numéricos (0-9).'
  } else {
    const level = resolveLevel(trimmedCode)
    if (!level) {
      errors.code = 'El código debe tener una longitud de 1, 2, 4 o 6 dígitos.'
    } else if (findAccountByCode(accounts, trimmedCode)) {
      errors.code = `Ya existe una cuenta con el código "${trimmedCode}".`
    } else {
      const parentCode = resolveParentCode(trimmedCode)
      if (parentCode && !findAccountByCode(accounts, parentCode)) {
        errors.code = `No existe la cuenta padre "${parentCode}". Crea primero el nivel superior.`
      }
    }
  }

  if (!trimmedName) {
    errors.name = 'El nombre de la cuenta es obligatorio.'
  } else if (trimmedName.length > 150) {
    errors.name = 'El nombre no puede superar los 150 caracteres.'
  }

  const level = resolveLevel(trimmedCode)
  if (level === 'CLASE' && values.nature !== 'DEBITO' && values.nature !== 'CREDITO') {
    errors.nature = 'Selecciona la naturaleza (Débito o Crédito) para la clase.'
  }

  return errors
}

export function hasFieldErrors(errors: CreateAccountFieldErrors): boolean {
  return Boolean(errors.code || errors.name || errors.nature || errors.general)
}

function classifyMessageToField(message: string): 'code' | 'name' | 'nature' | 'general' {
  const normalized = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (
    normalized.includes('naturaleza') ||
    normalized.includes('nature') ||
    normalized.includes('debito') ||
    normalized.includes('credito')
  ) {
    return 'nature'
  }

  if (normalized.includes('nombre') || /\bname\b/.test(normalized)) {
    return 'name'
  }

  if (
    normalized.includes('codigo') ||
    /\bcode\b/.test(normalized) ||
    normalized.includes('padre') ||
    normalized.includes('parent') ||
    normalized.includes('digito') ||
    normalized.includes('longitud') ||
    normalized.includes('numeric') ||
    normalized.includes('duplicad') ||
    normalized.includes('ya existe')
  ) {
    return 'code'
  }

  return 'general'
}

export function mapApiErrorToFieldErrors(error: ApiError): CreateAccountFieldErrors {
  const errors: CreateAccountFieldErrors = {}
  const messages = error.details.length > 0 ? error.details : [error.message]

  for (const msg of messages) {
    const field = classifyMessageToField(msg)
    if (field === 'code' && !errors.code) {
      errors.code = msg
    } else if (field === 'name' && !errors.name) {
      errors.name = msg
    } else if (field === 'nature' && !errors.nature) {
      errors.nature = msg
    } else if (!errors.general) {
      errors.general = msg
    }
  }

  if (!hasFieldErrors(errors)) {
    errors.general = error.message
  }

  return errors
}
