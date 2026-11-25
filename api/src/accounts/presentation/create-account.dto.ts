import type { AccountNature } from '../domain/account.types.js';

export interface CreateAccountDto {
  code: string;
  name: string;
  nature?: AccountNature;
}
