import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { AccountsService } from '../application/accounts.service.js';
import type { AccountTreeNode } from '../domain/account.types.js';
import type { CreateAccountDto } from './create-account.dto.js';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  getTree(): Promise<AccountTreeNode[]> {
    return this.accountsService.getTree();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAccountDto): Promise<AccountTreeNode> {
    return this.accountsService.create(dto);
  }

  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('code') code: string): Promise<void> {
    return this.accountsService.remove(code);
  }
}
