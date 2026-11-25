import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  findAccountByCode,
  hasFieldErrors,
  mapApiErrorToFieldErrors,
  resolveLevel,
  resolveParentCode,
  validateCreateAccountForm,
} from '../domain/accountRules'
import type { CreateAccountFieldErrors } from '../domain/accountRules'
import { ApiError } from '../services/httpClient'
import type {
  AccountLevel,
  AccountNature,
  AccountTreeNode,
  CreateAccountDto,
} from '../types/account'

export interface ChildPrefillTarget {
  parent: AccountTreeNode
  requestId: number
}

interface CreateAccountFormProps {
  accounts: AccountTreeNode[]
  creating: boolean
  catalogLoading: boolean
  catalogError: string | null
  prefillParent: ChildPrefillTarget | null
  onClearPrefillParent: () => void
  onCreate: (dto: CreateAccountDto) => Promise<AccountTreeNode>
}

const LEVEL_LABELS: Record<AccountLevel, string> = {
  CLASE: 'Clase (1 dígito)',
  GRUPO: 'Grupo (2 dígitos)',
  CUENTA: 'Cuenta (4 dígitos)',
  SUBCUENTA: 'Subcuenta (6 dígitos)',
}

const CHILD_STEP_HINTS: Record<Exclude<AccountLevel, 'SUBCUENTA'>, string> = {
  CLASE: 'Agrega 1 dígito adicional para crear un Grupo (2 dígitos).',
  GRUPO: 'Agrega 2 dígitos adicionales para crear una Cuenta (4 dígitos).',
  CUENTA: 'Agrega 2 dígitos adicionales para crear una Subcuenta (6 dígitos).',
}

export function CreateAccountForm({
  accounts,
  creating,
  catalogLoading,
  catalogError,
  prefillParent,
  onClearPrefillParent,
  onCreate,
}: CreateAccountFormProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [nature, setNature] = useState<AccountNature | ''>('')
  const [errors, setErrors] = useState<CreateAccountFieldErrors>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [lastPrefillRequestId, setLastPrefillRequestId] = useState<number | null>(null)
  const formRef = useRef<HTMLElement | null>(null)
  const codeInputRef = useRef<HTMLInputElement | null>(null)

  if (prefillParent && prefillParent.requestId !== lastPrefillRequestId) {
    setLastPrefillRequestId(prefillParent.requestId)
    setCode(prefillParent.parent.code)
    setName('')
    setNature('')
    setErrors({})
    setSuccessMessage(null)
  }

  useEffect(() => {
    if (!prefillParent) {
      return
    }

    const prefix = prefillParent.parent.code
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    const input = codeInputRef.current
    if (input) {
      input.focus()
      input.setSelectionRange(prefix.length, prefix.length)
    }
  }, [prefillParent])

  const trimmedCode = code.trim()
  const detectedLevel = useMemo(() => resolveLevel(trimmedCode), [trimmedCode])
  const parentCode = useMemo(() => resolveParentCode(trimmedCode), [trimmedCode])
  const parentAccount = useMemo(
    () => (parentCode ? findAccountByCode(accounts, parentCode) : null),
    [accounts, parentCode],
  )

  const activePrefillParent =
    prefillParent && trimmedCode.startsWith(prefillParent.parent.code)
      ? prefillParent.parent
      : null

  const isClass = detectedLevel === 'CLASE' && !activePrefillParent
  const effectiveParentForNature = parentAccount ?? activePrefillParent

  const handleCodeChange = (value: string) => {
    setCode(value)
    setSuccessMessage(null)
    if (prefillParent && !value.trim().startsWith(prefillParent.parent.code)) {
      onClearPrefillParent()
    }
    if (errors.code || errors.general) {
      setErrors((prev) => ({ ...prev, code: undefined, general: undefined }))
    }
    if (resolveLevel(value.trim()) !== 'CLASE' && errors.nature) {
      setErrors((prev) => ({ ...prev, nature: undefined }))
    }
  }

  const handleNameChange = (value: string) => {
    setName(value)
    setSuccessMessage(null)
    if (errors.name || errors.general) {
      setErrors((prev) => ({ ...prev, name: undefined, general: undefined }))
    }
  }

  const handleNatureChange = (value: AccountNature | '') => {
    setNature(value)
    setSuccessMessage(null)
    if (errors.nature || errors.general) {
      setErrors((prev) => ({ ...prev, nature: undefined, general: undefined }))
    }
  }

  const handleCancelPrefill = () => {
    onClearPrefillParent()
    setCode('')
    setName('')
    setNature('')
    setErrors({})
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage(null)

    const validationErrors = validateCreateAccountForm(
      { code, name, nature },
      accounts,
    )

    if (hasFieldErrors(validationErrors)) {
      setErrors(validationErrors)
      return
    }

    setErrors({})

    const dto: CreateAccountDto = {
      code: code.trim(),
      name: name.trim(),
      ...(detectedLevel === 'CLASE' && nature ? { nature } : {}),
    }

    try {
      const created = await onCreate(dto)
      setCode('')
      setName('')
      setNature('')
      setErrors({})
      onClearPrefillParent()
      setSuccessMessage(`Cuenta "${created.code} — ${created.name}" creada correctamente.`)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrors(mapApiErrorToFieldErrors(err))
      } else if (err instanceof Error) {
        setErrors({ general: err.message })
      } else {
        setErrors({ general: 'No se pudo crear la cuenta. Intenta nuevamente.' })
      }
    }
  }

  return (
    <section
      ref={formRef}
      className="card form-panel"
      aria-labelledby="create-account-heading"
    >
      <div className="form-panel__header">
        <h2 id="create-account-heading" className="form-panel__title">
          {activePrefillParent
            ? `Nueva hija de ${activePrefillParent.code}`
            : 'Nueva cuenta'}
        </h2>
        <p className="form-panel__subtitle">
          Usa 1, 2, 4 o 6 dígitos. El nivel y el padre se deducen automáticamente del código.
        </p>
      </div>

      <form className="account-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
        {activePrefillParent && activePrefillParent.level !== 'SUBCUENTA' && (
          <div className="alert alert--info alert--dismissible" role="status" aria-live="polite">
            <span>
              <strong>Cuenta padre:</strong> <code>{activePrefillParent.code}</code> —{' '}
              {activePrefillParent.name}. {CHILD_STEP_HINTS[activePrefillParent.level]}
            </span>
            <button
              type="button"
              className="alert__close"
              onClick={handleCancelPrefill}
              aria-label="Cancelar creación de cuenta hija"
              title="Limpiar padre prellenado"
            >
              ×
            </button>
          </div>
        )}

        {catalogLoading && accounts.length === 0 && (
          <div className="alert alert--info" role="status" aria-live="polite">
            Cargando catálogo actual para validar padres y duplicados...
          </div>
        )}

        {catalogError && accounts.length === 0 && (
          <div className="alert alert--warning" role="alert">
            No se pudo sincronizar el catálogo inicial. Reintenta la carga antes de crear cuentas dependientes.
          </div>
        )}

        {errors.general && (
          <div className="alert alert--error" role="alert">
            {errors.general}
          </div>
        )}

        {successMessage && (
          <div className="alert alert--success" role="status" aria-live="polite">
            {successMessage}
          </div>
        )}

        <div className="form-field">
          <label htmlFor="account-code" className="form-label">
            Código <span className="form-required">*</span>
          </label>
          <input
            ref={codeInputRef}
            id="account-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ej. 1, 11, 1105 o 110505"
            maxLength={6}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            disabled={creating}
            className={`form-input form-input--mono ${errors.code ? 'is-invalid' : ''}`}
            aria-invalid={Boolean(errors.code)}
            aria-describedby={errors.code ? 'account-code-error' : 'account-code-hint'}
          />
          {errors.code ? (
            <p id="account-code-error" className="field-error" role="alert">
              {errors.code}
            </p>
          ) : (
            <p id="account-code-hint" className="field-hint">
              {activePrefillParent && activePrefillParent.level !== 'SUBCUENTA'
                ? CHILD_STEP_HINTS[activePrefillParent.level]
                : 'Longitudes válidas: 1 (Clase), 2 (Grupo), 4 (Cuenta), 6 (Subcuenta).'}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="account-name" className="form-label">
            Nombre <span className="form-required">*</span>
          </label>
          <input
            id="account-name"
            name="name"
            type="text"
            autoComplete="off"
            placeholder="Ej. Activo, Disponible, Caja"
            maxLength={150}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={creating}
            className={`form-input ${errors.name ? 'is-invalid' : ''}`}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'account-name-error' : undefined}
          />
          {errors.name && (
            <p id="account-name-error" className="field-error" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="account-nature" className="form-label">
            Naturaleza {isClass && <span className="form-required">*</span>}
          </label>
          {isClass ? (
            <select
              id="account-nature"
              name="nature"
              value={nature}
              onChange={(e) => handleNatureChange(e.target.value as AccountNature | '')}
              disabled={creating}
              className={`form-input ${errors.nature ? 'is-invalid' : ''}`}
              aria-invalid={Boolean(errors.nature)}
              aria-describedby={errors.nature ? 'account-nature-error' : 'account-nature-hint'}
            >
              <option value="">Selecciona una naturaleza...</option>
              <option value="DEBITO">Débito</option>
              <option value="CREDITO">Crédito</option>
            </select>
          ) : (
            <input
              id="account-nature"
              type="text"
              readOnly
              disabled
              className="form-input form-input--readonly"
              value={
                effectiveParentForNature
                  ? `${effectiveParentForNature.nature === 'DEBITO' ? 'Débito' : 'Crédito'} (heredada de ${effectiveParentForNature.code})`
                  : 'Se hereda automáticamente de la cuenta padre'
              }
              aria-describedby={errors.nature ? 'account-nature-error' : 'account-nature-hint'}
            />
          )}
          {errors.nature ? (
            <p id="account-nature-error" className="field-error" role="alert">
              {errors.nature}
            </p>
          ) : (
            <p id="account-nature-hint" className="field-hint">
              {isClass
                ? 'Obligatoria solo al crear una Clase (1 dígito).'
                : 'Los grupos, cuentas y subcuentas heredan la naturaleza de su clase.'}
            </p>
          )}
        </div>

        {detectedLevel && (
          <div className="form-preview" aria-live="polite">
            <div className="form-preview__row">
              <span className="form-preview__label">Nivel detectado:</span>
              <span className="form-preview__value">{LEVEL_LABELS[detectedLevel]}</span>
            </div>
            <div className="form-preview__row">
              <span className="form-preview__label">Cuenta padre:</span>
              <span className="form-preview__value">
                {parentCode === null ? (
                  'Ninguna (raíz)'
                ) : parentAccount ? (
                  `${parentAccount.code} — ${parentAccount.name}`
                ) : (
                  <span className="form-preview__missing">
                    {parentCode} (no registrada aún)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn--primary form-submit"
          disabled={creating}
        >
          {creating ? (
            <>
              <span className="spinner spinner--sm spinner--light" aria-hidden="true" />
              <span>Creando cuenta...</span>
            </>
          ) : (
            'Crear cuenta'
          )}
        </button>
      </form>
    </section>
  )
}
