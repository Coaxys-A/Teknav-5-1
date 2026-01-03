import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { validatePasswordPolicy } from '../security/password.policy';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findFirstByRole(role: Role) {
    return this.prisma.user.findFirst({ where: { role } });
  }

  async ensureOwnerSeed() {
    const password = await bcrypt.hash('ChangeMe123!', 10);
    await this.prisma.user.create({
      data: {
        email: 'owner@teknav.local',
        password,
        role: Role.OWNER,
        name: 'مالک Teknav',
      },
    });
  }

  async create(dto: CreateUserDto, actorId?: number) {
    validatePasswordPolicy(dto.password);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: passwordHash,
        name: dto.name,
        role: dto.role ?? Role.WRITER,
      },
    });
    await this.audit.log('user.create', actorId, { target: user.id });
    return user;
  }

  async update(id: number, dto: UpdateUserDto, actorId?: number) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('USER_NOT_FOUND');
    }
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.password) {
      validatePasswordPolicy(dto.password);
      data.password = await bcrypt.hash(dto.password, 10);
    }
    const updated = await this.prisma.user.update({ where: { id }, data });
    await this.audit.log('user.update', actorId, { target: id });
    return updated;
  }

  async list() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async remove(id: number, actorId?: number) {
    await this.prisma.user.delete({ where: { id } });
    await this.audit.log('user.delete', actorId, { target: id });
  }
}
