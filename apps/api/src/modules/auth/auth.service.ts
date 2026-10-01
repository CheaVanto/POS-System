import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { Principal } from '../../common/auth/principal';
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto';
import { PERMISSIONS, ROLE_MATRIX } from './rbac.catalog';
import { AccessTokenPayload } from './strategies/jwt.strategy';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto, device?: string) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma
      .$transaction(async (tx) => {
        const company = await tx.company.create({
          data: { name: dto.companyName, currency: dto.currency ?? 'USD' },
        });

        await tx.permission.createMany({
          data: PERMISSIONS.map((key) => ({ key })),
          skipDuplicates: true,
        });
        const allPerms = await tx.permission.findMany();
        const permByKey = new Map(allPerms.map((p) => [p.key, p.id]));

        for (const [roleName, keys] of Object.entries(ROLE_MATRIX)) {
          const role = await tx.role.create({
            data: { companyId: company.id, name: roleName, isSystem: true },
          });
          const grantKeys = keys === '*' ? PERMISSIONS : keys;
          await tx.rolePermission.createMany({
            data: grantKeys
              .map((k) => permByKey.get(k))
              .filter((id): id is string => Boolean(id))
              .map((permissionId) => ({ roleId: role.id, permissionId })),
          });
        }

        const adminRole = await tx.role.findFirstOrThrow({
          where: { companyId: company.id, name: 'COMPANY_ADMIN' },
        });
        return tx.user.create({
          data: {
            companyId: company.id,
            email: dto.email.toLowerCase(),
            passwordHash,
            fullName: dto.fullName,
            roles: { create: { roleId: adminRole.id } },
          },
        });
      })
      .catch((e) => {
        if (e?.code === 'P2002') throw new ConflictException('Email already registered');
        throw e;
      });

    return this.issueSession(user.id, device);
  }

  async login(dto: LoginDto, device?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null, isActive: true },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return this.issueSession(user.id, device);
  }

  async refresh(dto: RefreshDto, device?: string) {
    const tokenHash = this.hashToken(dto.refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!stored) throw new UnauthorizedException('Invalid or expired refresh token');

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueSession(stored.userId, device);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<Principal> {
    return this.buildPrincipal(userId);
  }

  private async issueSession(userId: string, device?: string) {
    const principal = await this.buildPrincipal(userId);
    const payload: AccessTokenPayload = {
      sub: principal.userId,
      companyId: principal.companyId,
      email: principal.email,
      roles: principal.roles,
      permissions: principal.permissions,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<number>('jwt.accessTtl'),
    });

    const refreshToken = randomBytes(48).toString('hex');
    const ttl = this.config.get<number>('jwt.refreshTtl')!;
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        device,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<number>('jwt.accessTtl'),
      user: {
        id: principal.userId,
        email: principal.email,
        companyId: principal.companyId,
        roles: principal.roles,
        permissions: principal.permissions,
      },
    };
  }

  private async buildPrincipal(userId: string): Promise<Principal> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
      },
    });
    if (!user || user.deletedAt) throw new UnauthorizedException('User not found');

    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(
        user.roles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.key),
        ),
      ),
    );

    return {
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      roles,
      permissions,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
