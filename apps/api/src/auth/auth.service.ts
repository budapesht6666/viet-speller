import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { FamilyService } from '../family/family.service.js';
import { UsersService } from '../users/users.service.js';
import type { LoginDto, RegisterDto } from './auth.dto.js';
import { avatarUrl } from '../avatars/avatar-url.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly family: FamilyService,
    private readonly jwt: JwtService,
  ) {}

  /** Регистрация: с кодом — в существующую семью, без кода — новая семья. */
  async register(dto: RegisterDto): Promise<string> {
    if (await this.users.findByLogin(dto.login)) throw new ConflictException('Такой логин уже занят');
    const family = dto.inviteCode ? await this.family.findByInvite(dto.inviteCode) : await this.family.create(`Семья ${dto.name}`);
    const user = await this.users.create({
      login: dto.login,
      name: dto.name,
      passwordHash: await argon2.hash(dto.password),
      familyId: family.id,
    });
    return this.token(user.id);
  }

  async login(dto: LoginDto): Promise<string> {
    const user = await this.users.findByLogin(dto.login);
    // Один ответ на «нет логина» и «не тот пароль»: не подсказываем, какие
    // логины существуют.
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    return this.token(user.id);
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      login: user.login,
      name: user.name,
      avatarUrl: avatarUrl(user.id, user.avatar),
      family: { id: user.family.id, name: user.family.name, inviteCode: user.family.inviteCode },
    };
  }

  private token(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId });
  }
}
