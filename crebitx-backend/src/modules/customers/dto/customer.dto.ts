import { IsString, IsEmail, IsOptional, IsNumber, Min, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Global Tech Solutions' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@globaltech.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '123 Business Park, Bangalore' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 500000, description: 'Credit limit in currency' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  creditLimit?: number;

  @ApiPropertyOptional({ example: 30, description: 'Payment cycle in days' })
  @IsInt()
  @Min(1)
  @IsOptional()
  paymentCycle?: number;

  @ApiPropertyOptional({ example: 7, description: 'Grace period in days' })
  @IsInt()
  @Min(0)
  @IsOptional()
  gracePeriod?: number;

  @ApiPropertyOptional({ example: 2.5, description: 'Late fee percentage' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  lateFeePercent?: number;

  @ApiPropertyOptional({ example: 7, description: 'Reminder frequency in days' })
  @IsInt()
  @Min(1)
  @IsOptional()
  reminderFreq?: number;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'Global Tech Solutions' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@globaltech.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '123 Business Park, Bangalore' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  creditLimit?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsInt()
  @Min(1)
  @IsOptional()
  paymentCycle?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsInt()
  @Min(0)
  @IsOptional()
  gracePeriod?: number;

  @ApiPropertyOptional({ example: 2.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  lateFeePercent?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsInt()
  @Min(1)
  @IsOptional()
  reminderFreq?: number;
}

export class CustomerQueryDto {
  @ApiPropertyOptional({ example: 'Global Tech' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'name' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'name';

  @ApiPropertyOptional({ example: 'asc' })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
