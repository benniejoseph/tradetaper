import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisciplineService } from './discipline.service';
import { DisciplineController } from './discipline.controller';
import { TradeApproval } from './entities/trade-approval.entity';
import { TraderDiscipline } from './entities/trader-discipline.entity';
import { CooldownSession } from './entities/cooldown-session.entity';
import { TerminalFarmModule } from '../terminal-farm/terminal-farm.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TradeApproval,
      TraderDiscipline,
      CooldownSession,
    ]),
    TerminalFarmModule,
    SubscriptionsModule,
  ],
  controllers: [DisciplineController],
  providers: [DisciplineService],
  exports: [DisciplineService],
})
export class DisciplineModule {}
