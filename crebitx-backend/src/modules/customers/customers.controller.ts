import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from './dto/customer.dto';
import { AddLedgerEntryDto, LedgerQueryDto } from './dto/ledger.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCustomer(@CurrentTenant() tenantId: string, @Body() dto: CreateCustomerDto) {
    return await this.customersService.createCustomer(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with pagination and search' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  async getCustomers(@CurrentTenant() tenantId: string, @Query() query: CustomerQueryDto) {
    return await this.customersService.getCustomers(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID with full details' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerById(@CurrentTenant() tenantId: string, @Param('id') customerId: string) {
    return await this.customersService.getCustomerById(tenantId, customerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer details' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async updateCustomer(
    @CurrentTenant() tenantId: string,
    @Param('id') customerId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return await this.customersService.updateCustomer(tenantId, customerId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete customer (soft delete)' })
  @ApiResponse({ status: 204, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async deleteCustomer(@CurrentTenant() tenantId: string, @Param('id') customerId: string) {
    return await this.customersService.deleteCustomer(tenantId, customerId);
  }

  @Post('ledger')
  @ApiOperation({ summary: 'Add ledger entry (SALE, PAYMENT, RETURN, ADJUSTMENT)' })
  @ApiResponse({ status: 201, description: 'Ledger entry added successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async addLedgerEntry(@CurrentTenant() tenantId: string, @Body() dto: AddLedgerEntryDto) {
    return await this.customersService.addLedgerEntry(tenantId, dto);
  }

  @Get('ledger/history')
  @ApiOperation({ summary: 'Get ledger history for a customer' })
  @ApiResponse({ status: 200, description: 'Ledger history retrieved successfully' })
  async getLedgerHistory(@CurrentTenant() tenantId: string, @Query() query: LedgerQueryDto) {
    return await this.customersService.getLedgerHistory(tenantId, query);
  }

  @Post(':id/activities')
  @ApiOperation({ summary: 'Add a customer activity/note/promise to pay' })
  @ApiResponse({ status: 201, description: 'Activity added successfully' })
  async addActivity(
    @CurrentTenant() tenantId: string,
    @Param('id') customerId: string,
    @Body() dto: any,
  ) {
    return await this.customersService.addActivity(tenantId, customerId, dto);
  }
}
