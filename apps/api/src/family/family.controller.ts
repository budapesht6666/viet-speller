import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JoinFamilyDto } from './family.dto.js';
import { FamilyService } from './family.service.js';

@ApiTags('family')
@Controller('family')
export class FamilyController {
  constructor(private readonly family: FamilyService) {}

  /** Своя семья: название, код-приглашение, участники. */
  @Get()
  mine(@CurrentUser() userId: string) {
    return this.family.ofUser(userId);
  }

  /** Перейти в другую семью по коду. */
  @Post('join')
  join(@CurrentUser() userId: string, @Body() dto: JoinFamilyDto) {
    return this.family.join(userId, dto.inviteCode);
  }
}
