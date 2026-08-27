import { Controller, Get, Optional } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Optional() private readonly prismaService?: PrismaService,
    @Optional() private readonly configService?: ConfigService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  async check() {
    let databaseStatus = 'unknown';
    if (this.prismaService) {
      const isDbHealthy = await this.prismaService.isHealthy();
      databaseStatus = isDbHealthy ? 'connected' : 'disconnected';
    }

    const memoryUsage = process.memoryUsage();

    return {
      status: 'ok',
      service: 'PetFlow API',
      version: '0.1.0',
      environment: this.configService?.get<string>('app.env') || process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.floor(process.uptime()),
      database: databaseStatus,
      memory: {
        heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
