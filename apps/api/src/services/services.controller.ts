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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { CreatePriceRuleDto } from './dto/create-price-rule.dto';
import { UpdatePriceRuleDto } from './dto/update-price-rule.dto';
import { CalculatePriceDto } from './dto/calculate-price.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ---------------------------------------------------------------------------
  // Service Categories Endpoints
  // ---------------------------------------------------------------------------

  @Post('categories')
  @ApiOperation({ summary: 'Create a new service category' })
  @ApiResponse({ status: 201, description: 'Service category created successfully' })
  @ApiResponse({ status: 409, description: 'Category name already exists in tenant' })
  createCategory(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateServiceCategoryDto
  ) {
    return this.servicesService.createCategory(tenantId, dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all service categories for current tenant' })
  @ApiResponse({ status: 200, description: 'List of service categories' })
  findAllCategories(@CurrentTenant() tenantId: string) {
    return this.servicesService.findAllCategories(tenantId);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get service category by ID' })
  @ApiResponse({ status: 200, description: 'Service category details' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findCategoryById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.servicesService.findCategoryById(id, tenantId);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update service category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateServiceCategoryDto
  ) {
    return this.servicesService.updateCategory(id, tenantId, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete service category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  deleteCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.servicesService.deleteCategory(id, tenantId);
  }

  // ---------------------------------------------------------------------------
  // Services Endpoints
  // ---------------------------------------------------------------------------

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 409, description: 'Service name already exists in tenant' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateServiceDto
  ) {
    return this.servicesService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of services' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryServiceDto
  ) {
    return this.servicesService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service details by ID' })
  @ApiResponse({ status: 200, description: 'Service found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.servicesService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service details' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  @ApiResponse({ status: 409, description: 'Service name conflict' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateServiceDto
  ) {
    return this.servicesService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete service record' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cross-tenant access' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.servicesService.delete(id, tenantId);
  }

  // ---------------------------------------------------------------------------
  // Price Rules Endpoints
  // ---------------------------------------------------------------------------

  @Post('price-rules')
  @ApiOperation({ summary: 'Create a custom pricing rule by species and weight range' })
  @ApiResponse({ status: 201, description: 'Price rule created successfully' })
  createPriceRule(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreatePriceRuleDto
  ) {
    return this.servicesService.createPriceRule(tenantId, dto);
  }

  @Get(':serviceId/price-rules')
  @ApiOperation({ summary: 'Get all pricing rules for a specific service' })
  @ApiResponse({ status: 200, description: 'List of pricing rules' })
  findPriceRulesByService(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.servicesService.findPriceRulesByService(serviceId, tenantId);
  }

  @Get('price-rules/:id')
  @ApiOperation({ summary: 'Get price rule by ID' })
  @ApiResponse({ status: 200, description: 'Price rule details' })
  findPriceRuleById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.servicesService.findPriceRuleById(id, tenantId);
  }

  @Patch('price-rules/:id')
  @ApiOperation({ summary: 'Update price rule' })
  @ApiResponse({ status: 200, description: 'Price rule updated successfully' })
  updatePriceRule(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdatePriceRuleDto
  ) {
    return this.servicesService.updatePriceRule(id, tenantId, dto);
  }

  @Delete('price-rules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete price rule' })
  @ApiResponse({ status: 200, description: 'Price rule deleted successfully' })
  deletePriceRule(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ) {
    return this.servicesService.deletePriceRule(id, tenantId);
  }

  @Post('calculate-price')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate final service price and duration based on pet species and weight' })
  @ApiResponse({ status: 200, description: 'Resolved price and duration calculation' })
  calculateServicePrice(
    @CurrentTenant() tenantId: string,
    @Body() dto: CalculatePriceDto
  ) {
    return this.servicesService.calculateServicePrice(tenantId, dto);
  }
}
