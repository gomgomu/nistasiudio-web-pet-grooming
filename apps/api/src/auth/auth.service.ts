import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, JwtRefreshPayload, AuthTokens, AuthenticatedUser } from './auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(dto: LoginDto): Promise<{ tokens: AuthTokens; user: AuthenticatedUser }> {
    // 1. Resolve Tenant
    let tenantId = dto.tenantId;
    if (!tenantId && dto.tenantSlug) {
      const tenant = await this.tenantsService.findBySlug(dto.tenantSlug);
      tenantId = tenant.id;
    }

    if (!tenantId) {
      throw new UnauthorizedException('Tenant information (slug or ID) is required for login');
    }

    // 2. Lookup User
    const user = await this.usersService.findByEmailForAuth(tenantId, dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active. Please contact administrator');
    }

    // 3. Verify Password
    const isPasswordValid = await this.usersService.verifyPassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 4. Extract allowed branches
    const allowedBranches = (user.userBranches || []).map((ub) => ({
      id: ub.branch.id,
      name: ub.branch.name,
      code: ub.branch.code,
    }));

    const branchIds = allowedBranches.map((b) => b.id);

    // 5. Generate Tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      branchIds,
    });

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      phone: user.phone,
      allowedBranches,
    };

    return {
      tokens,
      user: authenticatedUser,
    };
  }

  async refreshToken(refreshTokenString: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<JwtRefreshPayload>(refreshTokenString, {
        secret: this.configService.get<string>('auth.jwtSecret') || 'default-super-secret-jwt-key-minimum-32-chars',
      });

      const user = await this.usersService.findById(payload.sub, payload.tenantId);
      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid session or inactive user');
      }

      const branchIds = (user.userBranches || []).map((ub) => ub.branch.id);

      return this.generateTokens({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
        branchIds,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async generateTokens(payload: JwtPayload): Promise<AuthTokens> {
    const secret = this.configService.get<string>('auth.jwtSecret') || 'default-super-secret-jwt-key-minimum-32-chars';
    const expiresIn = 15 * 60; // 15 minutes in seconds

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret,
        expiresIn: `${expiresIn}s`,
      }),
      this.jwtService.signAsync(
        {
          sub: payload.sub,
          email: payload.email,
          tenantId: payload.tenantId,
        },
        {
          secret,
          expiresIn: '7d',
        }
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }
}
