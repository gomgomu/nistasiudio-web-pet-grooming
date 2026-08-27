import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertGroomingProfileDto } from './dto/upsert-grooming-profile.dto';

@Injectable()
export class GroomingProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Validates pet ownership within the authenticated tenant
   */
  private async getVerifiedPet(tenantId: string, petId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException(`Pet with ID '${petId}' not found`);
    }

    if (pet.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Pet does not belong to your organization'
      );
    }

    return pet;
  }

  /**
   * Get grooming profile for a specific pet
   */
  async findByPetId(tenantId: string, petId: string) {
    await this.getVerifiedPet(tenantId, petId);

    const profile = await this.prisma.groomingProfile.findUnique({
      where: { petId },
      include: {
        preferredGroomer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return profile;
  }

  /**
   * Upsert grooming profile for a specific pet
   */
  async upsertByPetId(
    tenantId: string,
    petId: string,
    dto: UpsertGroomingProfileDto
  ) {
    await this.getVerifiedPet(tenantId, petId);

    // Validate preferred groomer if specified
    if (dto.preferredGroomerId) {
      const groomer = await this.prisma.user.findUnique({
        where: { id: dto.preferredGroomerId },
      });

      if (!groomer) {
        throw new NotFoundException(
          `Staff with ID '${dto.preferredGroomerId}' not found`
        );
      }

      if (groomer.tenantId !== tenantId) {
        throw new ForbiddenException(
          'Access denied: Staff does not belong to your organization'
        );
      }
    }

    // Upsert grooming profile
    const profile = await this.prisma.groomingProfile.upsert({
      where: { petId },
      create: {
        tenantId,
        petId,
        preferredCut: dto.preferredCut,
        shampoo: dto.shampoo,
        warnings: dto.warnings,
        behaviorNotes: dto.behaviorNotes,
        preferredGroomerId: dto.preferredGroomerId,
        specialHandling: dto.specialHandling,
      },
      update: {
        preferredCut: dto.preferredCut,
        shampoo: dto.shampoo,
        warnings: dto.warnings,
        behaviorNotes: dto.behaviorNotes,
        preferredGroomerId: dto.preferredGroomerId,
        specialHandling: dto.specialHandling,
      },
      include: {
        preferredGroomer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Optionally sync behavioral notes back to Pet record if provided
    if (dto.behaviorNotes !== undefined) {
      await this.prisma.pet.update({
        where: { id: petId },
        data: {
          behavioralNotes: dto.behaviorNotes,
        },
      });
    }

    return profile;
  }

  /**
   * Delete / Reset grooming profile for a pet
   */
  async deleteByPetId(tenantId: string, petId: string) {
    await this.getVerifiedPet(tenantId, petId);

    const existing = await this.prisma.groomingProfile.findUnique({
      where: { petId },
    });

    if (!existing) {
      return {
        success: true,
        message: 'No grooming profile existed for this pet',
      };
    }

    await this.prisma.groomingProfile.delete({
      where: { petId },
    });

    return {
      success: true,
      message: 'Grooming profile reset successfully',
    };
  }
}
