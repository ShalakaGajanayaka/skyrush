import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../auth/entities/user.entity';
import { Transaction } from '../auth/entities/transaction.entity';
import { DepositRequest } from '../auth/entities/deposit-request.entity';
import { WithdrawalRequest } from '../auth/entities/withdrawal-request.entity';
import { PoolAuditLog } from '../auth/entities/pool-audit-log.entity';
import { BetHistory } from '../auth/entities/bet-history.entity';
import { RedisModule } from '../redis/redis.module';
import { GameModule } from '../game/game.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Transaction, DepositRequest, WithdrawalRequest, PoolAuditLog, BetHistory]),
    RedisModule,
    GameModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
