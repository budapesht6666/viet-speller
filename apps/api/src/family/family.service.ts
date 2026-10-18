import { randomInt } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';

/** Без похожих символов: код диктуют голосом и набирают с экрана. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

@Injectable()
export class FamilyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  private newCode(): string {
    return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
  }

  async create(name: string) {
    // Совпадение кода почти невероятно, но unique-ограничение в базе
    // всё равно есть — несколько попыток дешевле ошибки при регистрации.
    for (let attempt = 0; attempt < 5; attempt++) {
      const inviteCode = this.newCode();
      if (!(await this.prisma.family.findUnique({ where: { inviteCode } }))) {
        return this.prisma.family.create({ data: { name, inviteCode } });
      }
    }
    throw new Error('не удалось подобрать код семьи');
  }

  async findByInvite(code: string) {
    const family = await this.prisma.family.findUnique({ where: { inviteCode: code.trim().toUpperCase() } });
    if (!family) throw new NotFoundException('Семьи с таким кодом нет');
    return family;
  }

  async ofUser(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException();
    const members = await this.prisma.user.findMany({
      where: { familyId: user.familyId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
    });
    return { id: user.family.id, name: user.family.name, inviteCode: user.family.inviteCode, members };
  }

  async join(userId: string, code: string) {
    const family = await this.findByInvite(code);
    await this.users.moveToFamily(userId, family.id);
    return this.ofUser(userId);
  }
}
