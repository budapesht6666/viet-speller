import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class JoinFamilyDto {
  @ApiProperty({ example: 'K7M2QX', description: 'Код-приглашение семьи' })
  @IsString()
  @Length(6, 6)
  inviteCode!: string;
}
