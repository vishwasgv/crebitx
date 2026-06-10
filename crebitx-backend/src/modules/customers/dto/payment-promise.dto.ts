import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentPromiseDto {
  @ApiProperty({ example: 15000, description: 'Amount promised by the customer' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: '2026-06-15', description: 'Date customer promised to pay' })
  @IsDateString()
  promisedDate: string;

  @ApiPropertyOptional({ example: 'Customer promised after phone follow-up' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class MarkPaymentPromiseDto {
  @ApiPropertyOptional({ example: 'Confirmed after payment received' })
  @IsString()
  @IsOptional()
  note?: string;
}
