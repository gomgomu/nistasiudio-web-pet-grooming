import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { ImportCustomerCsvDto, CsvRowDto } from './dto/import-customer-csv.dto';
import { Prisma, PetSpecies } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: {
        tenantId_phone: {
          tenantId,
          phone: dto.phone,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Customer with phone number '${dto.phone}' already exists in this tenant`
      );
    }

    return this.prisma.customer.create({
      data: {
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        lineUserId: dto.lineUserId,
        address: dto.address,
        notes: dto.notes,
        marketingStatus: dto.marketingStatus,
      },
      include: {
        pets: true,
      },
    });
  }

  async findAll(tenantId: string, query: QueryCustomerDto) {
    const { q, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      tenantId,
    };

    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      where.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pets: {
            select: {
              id: true,
              name: true,
              species: true,
              breed: true,
              photoUrl: true,
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, tenantId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        pets: {
          orderBy: { createdAt: 'asc' },
        },
        customerTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${id}' not found`);
    }

    if (customer.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Customer does not belong to your organization'
      );
    }

    return customer;
  }

  async findByPhone(phone: string, tenantId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        tenantId_phone: {
          tenantId,
          phone,
        },
      },
      include: {
        pets: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with phone '${phone}' not found`);
    }

    return customer;
  }

  async update(id: string, tenantId: string, dto: UpdateCustomerDto) {
    await this.findById(id, tenantId);

    if (dto.phone) {
      const duplicatePhone = await this.prisma.customer.findUnique({
        where: {
          tenantId_phone: {
            tenantId,
            phone: dto.phone,
          },
        },
      });

      if (duplicatePhone && duplicatePhone.id !== id) {
        throw new ConflictException(
          `Phone number '${dto.phone}' is already in use by another customer`
        );
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: dto,
      include: {
        pets: true,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.prisma.customer.delete({
      where: { id },
    });
  }

  async importCsv(tenantId: string, dto: ImportCustomerCsvDto) {
    let rows: CsvRowDto[] = [];

    if (dto.rows && dto.rows.length > 0) {
      rows = dto.rows;
    } else if (dto.csvContent) {
      rows = this.parseCsv(dto.csvContent);
    }

    const errors: { row: number; phone?: string; name?: string; reason: string }[] = [];
    let importedCustomers = 0;
    let importedPets = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1;
      const row = rows[i];

      if (!row.firstName || row.firstName.trim().length === 0) {
        errors.push({ row: rowNum, phone: row.phone, reason: 'First name is required' });
        continue;
      }

      if (!row.phone || row.phone.trim().length === 0) {
        errors.push({ row: rowNum, name: row.firstName, reason: 'Phone number is required' });
        continue;
      }

      const cleanPhone = row.phone.trim();

      try {
        let customer = await this.prisma.customer.findUnique({
          where: {
            tenantId_phone: {
              tenantId,
              phone: cleanPhone,
            },
          },
        });

        if (!customer) {
          customer = await this.prisma.customer.create({
            data: {
              tenantId,
              firstName: row.firstName.trim(),
              lastName: row.lastName?.trim() || '',
              phone: cleanPhone,
              email: row.email?.trim() || null,
            },
          });
          importedCustomers++;
        }

        if (row.petName && row.petName.trim().length > 0) {
          let species: PetSpecies = PetSpecies.DOG;
          if (row.species) {
            const upper = row.species.toUpperCase().trim();
            if (Object.values(PetSpecies).includes(upper as PetSpecies)) {
              species = upper as PetSpecies;
            }
          }

          await this.prisma.pet.create({
            data: {
              tenantId,
              customerId: customer.id,
              name: row.petName.trim(),
              species,
              breed: row.breed?.trim() || null,
              allergies: row.allergies?.trim() || null,
              behavioralNotes: row.behavioralNotes?.trim() || null,
            },
          });
          importedPets++;
        }
      } catch (err: any) {
        errors.push({
          row: rowNum,
          phone: cleanPhone,
          name: row.firstName,
          reason: err.message || 'Database error during row insertion',
        });
      }
    }

    return {
      totalRows: rows.length,
      importedCustomers,
      importedPets,
      failedRows: errors.length,
      errors,
    };
  }

  private parseCsv(csvText: string): CsvRowDto[] {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const result: CsvRowDto[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length === 0 || parts.every((p) => p === '')) continue;

      const obj: any = {};
      headers.forEach((h, idx) => {
        const val = parts[idx];
        if (h === 'firstname' || h === 'first_name' || h === 'ชื่อ') obj.firstName = val;
        else if (h === 'lastname' || h === 'last_name' || h === 'นามสกุล') obj.lastName = val;
        else if (h === 'phone' || h === 'tel' || h === 'เบอร์โทร') obj.phone = val;
        else if (h === 'email' || h === 'อีเมล') obj.email = val;
        else if (h === 'petname' || h === 'pet_name' || h === 'ชื่อสัตว์เลี้ยง') obj.petName = val;
        else if (h === 'species' || h === 'ประเภทสัตว์') obj.species = val;
        else if (h === 'breed' || h === 'สายพันธุ์') obj.breed = val;
        else if (h === 'allergies' || h === 'แพ้ยา') obj.allergies = val;
        else if (h === 'behavioralnotes' || h === 'behavioral_notes' || h === 'พฤติกรรม') obj.behavioralNotes = val;
      });

      if (obj.firstName || obj.phone) {
        result.push(obj as CsvRowDto);
      }
    }

    return result;
  }
}
