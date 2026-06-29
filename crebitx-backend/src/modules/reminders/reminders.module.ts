import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { RemindersController } from './reminders.controller';
import { ReminderDispatchService } from './reminder-dispatch.service';
import { NotificationSenderService } from './notification-sender.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RemindersController],
  providers: [ReminderDispatchService, NotificationSenderService],
  exports: [ReminderDispatchService],
})
export class RemindersModule {}
