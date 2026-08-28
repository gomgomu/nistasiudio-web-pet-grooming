import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../notifications/queues/queue.service';
import * as os from 'os';

export interface SystemMetrics {
  uptimeSeconds: number;
  processMemory: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
    externalMb: number;
  };
  os: {
    platform: string;
    cpus: number;
    freeMemoryMb: number;
    totalMemoryMb: number;
    loadAverage: number[];
  };
  timestamp: string;
}

export interface PlatformObservabilityOverview {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  system: SystemMetrics;
  queues: any[];
  database: {
    status: 'CONNECTED' | 'DISCONNECTED';
    latencyMs: number;
  };
  tenantsCount: number;
  activeUsersCount: number;
}

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService
  ) {}

  getSystemMetrics(): SystemMetrics {
    const memory = process.memoryUsage();
    return {
      uptimeSeconds: Math.floor(process.uptime()),
      processMemory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        externalMb: Math.round(memory.external / (1024 * 1024)),
      },
      os: {
        platform: os.platform(),
        cpus: os.cpus().length,
        freeMemoryMb: Math.round(os.freemem() / (1024 * 1024)),
        totalMemoryMb: Math.round(os.totalmem() / (1024 * 1024)),
        loadAverage: os.loadavg ? os.loadavg() : [0, 0, 0],
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getQueueMetrics() {
    try {
      return await this.queueService.getQueueMetrics();
    } catch (err: any) {
      this.logger.warn(`Could not fetch BullMQ metrics: ${err.message}`);
      return [];
    }
  }

  async getPlatformOverview(): Promise<PlatformObservabilityOverview> {
    const system = this.getSystemMetrics();

    // Check DB latency and connection
    const dbStart = Date.now();
    let dbStatus: 'CONNECTED' | 'DISCONNECTED' = 'CONNECTED';
    let dbLatency = 0;
    let tenantsCount = 0;
    let activeUsersCount = 0;

    try {
      [tenantsCount, activeUsersCount] = await Promise.all([
        this.prisma.tenant.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      ]);
      dbLatency = Date.now() - dbStart;
    } catch (err: any) {
      dbStatus = 'DISCONNECTED';
      this.logger.error(`Database connectivity check failed: ${err.message}`);
    }

    const queueMetrics = await this.getQueueMetrics();

    const isHealthy = dbStatus === 'CONNECTED';

    return {
      status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
      system,
      queues: queueMetrics,
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      tenantsCount,
      activeUsersCount,
    };
  }
}
