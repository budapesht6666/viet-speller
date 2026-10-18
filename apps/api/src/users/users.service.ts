import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByLogin(login: string) {
    return this.prisma.user.findUnique({ where: { login: login.toLowerCase() } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { family: true } });
  }

  create(data: { login: string; name: string; passwordHash: string; familyId: string }) {
    return this.prisma.user.create({ data: { ...data, login: data.login.toLowerCase() } });
  }

  moveToFamily(userId: string, familyId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { familyId } });
  }
}
