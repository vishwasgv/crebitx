import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EntryTag {
  SALE = 'SALE',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
  PAYMENT = 'PAYMENT',
}

export class AddLedgerEntryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  customerId: string;

  @ApiProperty({ example: 150000, description: 'Transaction amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: EntryTag, example: EntryTag.SALE })
  @IsEnum(EntryTag)
  tag: EntryTag;

  @ApiPropertyOptional({ example: 'Invoice #GT-102' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class LedgerQueryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 50 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 50;
}
