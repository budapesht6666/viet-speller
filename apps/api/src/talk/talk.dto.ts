import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

/** Реплика разговора: собеседника (npc) или человека (me). */
export class TurnDto {
  @ApiProperty({ enum: ['npc', 'me'] })
  @IsIn(['npc', 'me'])
  who!: 'npc' | 'me';

  @ApiProperty({ example: 'Chào anh, mua gì?' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  vi!: string;
}

/**
 * Весь разговор присылает телефон: сервер его не хранит. Пустой список —
 * собеседник начинает первым.
 */
export class TalkDto {
  @ApiProperty({ example: 'market' })
  @IsString()
  @MaxLength(40)
  scenarioId!: string;

  @ApiProperty({ type: [TurnDto], maxItems: 30 })
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => TurnDto)
  turns!: TurnDto[];
}
