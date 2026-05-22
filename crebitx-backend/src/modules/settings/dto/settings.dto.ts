import { IsInt, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ReminderTone {
  FRIENDLY = 'FRIENDLY',
  BALANCED = 'BALANCED',
  STRICT = 'STRICT',
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 30, description: 'Default payment cycle in days' })
  @IsInt()
  @Min(1)
  defaultCycle?: number;

  @ApiPropertyOptional({ example: 7, description: 'Default grace period in days' })
  @IsInt()
  @Min(0)
  defaultGrace?: number;

  @ApiPropertyOptional({ example: 0.6, description: 'Risk weight for payment delay (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  riskWeightDelay?: number;

  @ApiPropertyOptional({ example: 0.4, description: 'Risk weight for credit limit (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  riskWeightLimit?: number;

  @ApiPropertyOptional({ enum: ReminderTone, example: ReminderTone.FRIENDLY })
  @IsEnum(ReminderTone)
  reminderTone?: ReminderTone;

  @ApiPropertyOptional({ example: 10000, description: 'Auto-approve credit limit' })
  @IsNumber()
  @Min(0)
  autoApproveLimit?: number;
}
