import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'pavel' })
  @IsString()
  @Length(2, 32)
  @Matches(/^[a-zA-Z0-9._-]+$/, { message: 'Логин — латиница, цифры, точка, дефис' })
  login!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @Length(8, 200)
  password!: string;
}

export class RegisterDto extends LoginDto {
  @ApiProperty({ example: 'Павел', description: 'Как показывать в семейном рейтинге' })
  @IsString()
  @Length(1, 40)
  name!: string;

  @ApiPropertyOptional({ example: 'K7M2QX', description: 'Код семьи. Без него создаётся новая семья' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  inviteCode?: string;
}
