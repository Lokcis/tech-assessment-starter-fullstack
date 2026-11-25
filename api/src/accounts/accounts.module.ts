import { Module } from '@nestjs/common';
import { AccountsService } from './application/accounts.service.js';
import { ACCOUNT_REPOSITORY } from './domain/account.repository.js';
import { SqliteAccountRepository } from './infrastructure/sqlite-account.repository.js';
import { AccountsController } from './presentation/accounts.controller.js';

@Module({
  controllers: [AccountsController],
  providers: [
    AccountsService,
    {
      provide: ACCOUNT_REPOSITORY,
      useFactory: () => new SqliteAccountRepository(),
    },
  ],
  exports: [AccountsService],
})
export class AccountsModule {}
