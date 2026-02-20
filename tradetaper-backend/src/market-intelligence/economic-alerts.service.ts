import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EconomicEventAlert } from './entities/economic-event-alert.entity';

@Injectable()
export class EconomicAlertsService {
  constructor(
    @InjectRepository(EconomicEventAlert)
    private readonly alertsRepo: Repository<EconomicEventAlert>,
  ) {}

  async listUserAlerts(userId: string) {
    const alerts = await this.alertsRepo.find({ where: { userId } });
    return { items: alerts.map((alert) => alert.eventId) };
  }

  async subscribe(userId: string, eventId: string) {
    const existing = await this.alertsRepo.findOne({
      where: { userId, eventId },
    });
    if (existing) {
      return existing;
    }
    const alert = this.alertsRepo.create({ userId, eventId });
    return this.alertsRepo.save(alert);
  }

  async unsubscribe(userId: string, eventId: string) {
    await this.alertsRepo.delete({ userId, eventId });
    return { success: true };
  }

  async getAlertsForEvents(eventIds: string[]) {
    if (!eventIds.length) return [];
    return this.alertsRepo.find({ where: { eventId: In(eventIds) } });
  }
}
