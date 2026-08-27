import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Inventory & Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product or medication in catalog' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateProductDto
  ) {
    return this.productsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List products with category, prescription, and search filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of products' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryProductsDto
  ) {
    return this.productsService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details by ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product properties' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto
  ) {
    return this.productsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product or deactivate if transaction history exists' })
  @ApiResponse({ status: 200, description: 'Product removed/deactivated' })
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.productsService.remove(tenantId, id);
  }
}
