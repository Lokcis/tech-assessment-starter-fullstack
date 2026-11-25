import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ACCOUNT_REPOSITORY,
  type IAccountRepository,
} from '../domain/account.repository.js';
import {
  IncompatibleAccountNatureError,
  InvalidAccountCodeError,
  MissingClassNatureError,
  isValidAccountNature,
  resolveAccountLevel,
  resolveAccountNature,
  resolveParentCode,
} from '../domain/account.rules.js';
import { buildAccountTree } from '../domain/account-tree.builder.js';
import type {
  Account,
  AccountNature,
  AccountTreeNode,
} from '../domain/account.types.js';
import type { CreateAccountDto } from '../presentation/create-account.dto.js';

@Injectable()
export class AccountsService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly repository: IAccountRepository,
  ) {}

  async getTree(): Promise<AccountTreeNode[]> {
    const accounts = await this.repository.findAllOrdered();
    return buildAccountTree(accounts);
  }

  async create(dto: CreateAccountDto): Promise<AccountTreeNode> {
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('El cuerpo de la petición es inválido.');
    }

    if (typeof dto.code !== 'string' || dto.code.length === 0) {
      throw new BadRequestException('El código de la cuenta es obligatorio.');
    }

    if (typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('El nombre de la cuenta es obligatorio.');
    }

    const requestedNature = this.normalizeRequestedNature(dto.nature);

    let level: Account['level'];
    let parentCode: string | null;
    try {
      level = resolveAccountLevel(dto.code);
      parentCode = resolveParentCode(dto.code);
    } catch (error) {
      if (error instanceof InvalidAccountCodeError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const existing = await this.repository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(
        `Ya existe una cuenta con el código '${dto.code}'.`,
      );
    }

    let parent: Account | null = null;
    if (parentCode !== null) {
      parent = await this.repository.findByCode(parentCode);
      if (!parent) {
        throw new UnprocessableEntityException(
          `No se puede crear la cuenta '${dto.code}' porque su cuenta padre '${parentCode}' no existe.`,
        );
      }
    }

    let nature: AccountNature;
    try {
      nature = resolveAccountNature(
        level,
        requestedNature,
        parent?.nature ?? null,
      );
    } catch (error) {
      if (error instanceof MissingClassNatureError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof IncompatibleAccountNatureError) {
        throw new UnprocessableEntityException(error.message);
      }
      throw error;
    }

    const created = await this.repository.create({
      code: dto.code,
      name: dto.name.trim(),
      level,
      nature,
      parentCode,
      createdAt: new Date().toISOString(),
    });

    return {
      code: created.code,
      name: created.name,
      level: created.level,
      nature: created.nature,
      parentCode: created.parentCode,
      allowsMovements: true,
      children: [],
    };
  }

  async remove(code: string): Promise<void> {
    const existing = await this.repository.findByCode(code);
    if (!existing) {
      throw new NotFoundException(
        `No existe una cuenta con el código '${code}'.`,
      );
    }

    const hasChildren = await this.repository.hasChildren(code);
    if (hasChildren) {
      throw new ConflictException(
        `No se puede eliminar la cuenta '${code}' porque tiene cuentas hijas.`,
      );
    }

    await this.repository.deleteByCode(code);
  }

  private normalizeRequestedNature(
    value: unknown,
  ): AccountNature | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (!isValidAccountNature(value)) {
      const formatted =
        typeof value === 'string' ? value : JSON.stringify(value);
      throw new BadRequestException(
        `La naturaleza '${formatted}' no es válida. Valores permitidos: DEBITO o CREDITO.`,
      );
    }

    return value;
  }
}
