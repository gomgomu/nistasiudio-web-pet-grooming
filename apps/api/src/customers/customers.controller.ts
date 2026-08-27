import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { ImportCustomerCsvDto } from './dto/import-customer-csv.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('import-csv')
  @ApiOperation({ summary: 'Bulk import customers and pets from CSV content or rows' })
  @ApiResponse({ status: 200, description: 'Import executed with summary and error reporting' })
  importCsv(
    @CurrentTenant() tenantId: string,
    @Body() dto: ImportCustomerCsvDto
  ) {
    return this.customersService.importCsv(tenantId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer profile' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 409, description: 'Customer phone already exists' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateCustomerDto
  ) {
    return this.customersService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with pagination and search' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryCustomerDto
  ) {
    return this.customersService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer profile details by ID' })
  @ApiResponse({ status: 200, description: 'Customer found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.customersService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer details' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  @ApiResponse({ status: 409, description: 'Phone number conflict' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateCustomerDto
  ) {
    return this.customersService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete customer record' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.customersService.delete(id, tenantId);
  }
}
