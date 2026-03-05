import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisciplineService } from './discipline.service';
import { DisciplineController } from './discipline.controller';
import { TradeApproval } from './entities/trade-approval.entity';
import { TraderDiscipline } from './entities/trader-discipline.entity';
import { CooldownSession } from './entities/cooldown-session.entity';
import { TerminalFarmModule } from '../terminal-farm/terminal-farm.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { Trade } from '../trades/entities/trade.entity';
import { IfThenPlan } from './entities/if-then-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TradeApproval,
      TraderDiscipline,
      CooldownSession,
      Trade,
      IfThenPlan,
    ]),
    forwardRef(() => TerminalFarmModule),
    SubscriptionsModule,
  ],
  controllers: [DisciplineController],
  providers: [DisciplineService],
  exports: [DisciplineService],
})
export class DisciplineModule {}
