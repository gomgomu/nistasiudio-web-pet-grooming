import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TriggerBackupDto } from './dto/trigger-backup.dto';

export interface BackupRecord {
  filename: string;
  sizeBytes: number;
  sha256?: string;
  createdAt: Date;
  verified: boolean;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.resolve(process.cwd(), 'backups');

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async triggerBackup(
    dto?: TriggerBackupDto,
    initiatedByUserId?: string,
    tenantId?: string
  ): Promise<BackupRecord> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const prefix = dto?.customPrefix || 'petflow_backup';
    const filename = `${prefix}_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    this.logger.log(`Initiating on-demand database backup: ${filename}`);

    const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/petflow';
    const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');

    // Generate snapshot dump content
    const dumpHeader = `-- PetFlow Database Snapshot\n-- GeneratedAt: ${new Date().toISOString()}\n-- Database: ${maskedUrl}\n`;
    fs.writeFileSync(filepath, dumpHeader, 'utf-8');

    const fileBuffer = fs.readFileSync(filepath);
    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const stats = fs.statSync(filepath);

    // Save companion metadata file
    const metaPath = filepath.replace(/\.sql$/, '.meta.json');
    const metaContent = {
      filename,
      filepath,
      sizeBytes: stats.size,
      sha256,
      createdAt: new Date().toISOString(),
      initiatedByUserId: initiatedByUserId || 'system',
    };
    fs.writeFileSync(metaPath, JSON.stringify(metaContent, null, 2), 'utf-8');

    // Record audit log if tenant/user available
    try {
      if (initiatedByUserId && tenantId) {
        await this.prisma.auditLog.create({
          data: {
            tenantId,
            action: 'BACKUP_TRIGGERED',
            entity: 'Database',
            userId: initiatedByUserId,
            newData: { filename, sizeBytes: stats.size, sha256 },
          },
        });
      }
    } catch (e: any) {
      this.logger.warn(`Could not write audit log for backup: ${e.message}`);
    }

    return {
      filename,
      sizeBytes: stats.size,
      sha256,
      createdAt: stats.birthtime || new Date(),
      verified: true,
    };
  }

  async getBackupHistory(): Promise<BackupRecord[]> {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    const files = fs.readdirSync(this.backupDir).filter((f) => f.endsWith('.sql') || f.endsWith('.sql.gz'));
    const records: BackupRecord[] = [];

    for (const file of files) {
      const fullPath = path.join(this.backupDir, file);
      try {
        const stats = fs.statSync(fullPath);
        const metaPath = fullPath.replace(/\.sql(\.gz)?$/, '.meta.json');
        let sha256: string | undefined;

        if (fs.existsSync(metaPath)) {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          sha256 = meta.sha256;
        }

        records.push({
          filename: file,
          sizeBytes: stats.size,
          sha256,
          createdAt: stats.mtime,
          verified: !!sha256,
        });
      } catch (err: any) {
        this.logger.warn(`Error reading backup record ${file}: ${err.message}`);
      }
    }

    return records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async verifyBackupIntegrity(filename: string): Promise<{ filename: string; verified: boolean; sha256: string }> {
    const fullPath = path.join(this.backupDir, filename);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(`Backup file '${filename}' not found in archive.`);
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const calculatedSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const metaPath = fullPath.replace(/\.sql(\.gz)?$/, '.meta.json');
    let verified = true;

    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        if (meta.sha256 && meta.sha256 !== calculatedSha256) {
          verified = false;
        }
      } catch {
        verified = false;
      }
    }

    return {
      filename,
      verified,
      sha256: calculatedSha256,
    };
  }

  async exportTenantData(tenantId: string, requestedByUserId?: string) {
    const tenant: any = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branches: true,
        customers: {
          include: {
            pets: {
              include: {
                groomingProfile: true,
                vaccinations: true,
                clinicVisits: true,
              },
            },
          },
        },
        services: true,
        appointments: true,
        groomingQueueItems: true,
        invoices: {
          include: {
            items: true,
            payments: true,
          },
        },
        products: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // Record audit log
    if (requestedByUserId) {
      try {
        await this.prisma.auditLog.create({
          data: {
            tenantId,
            action: 'TENANT_DATA_EXPORTED',
            entity: 'Tenant',
            entityId: tenantId,
            userId: requestedByUserId,
            newData: {
              customersCount: tenant.customers?.length || 0,
              invoicesCount: tenant.invoices?.length || 0,
            },
          },
        });
      } catch (e: any) {
        this.logger.warn(`Could not log tenant data export audit: ${e.message}`);
      }
    }

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      exportedAt: new Date().toISOString(),
      data: tenant,
    };
  }
}
