import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsISO8601, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { SPEECH_ENGINES, type SpeechEngine } from '@viet/core';

/** Попытка сказать, как её шлёт телефон. Схема — SpeechAttempt из packages/core/src/speech.ts. */
export class SpeechAttemptDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: '2026-10-19T03:00:00.000Z' })
  @IsISO8601()
  at!: string;

  @ApiProperty({ example: 'pol-cam-on' })
  @IsString()
  @MaxLength(80)
  itemId!: string;

  @ApiProperty({ description: 'Что вернул движок; пусто — ничего', example: 'cảm ơn' })
  @IsString()
  @MaxLength(300)
  heard!: string;

  @ApiProperty({ enum: SPEECH_ENGINES })
  @IsIn(SPEECH_ENGINES)
  engine!: SpeechEngine;
}

export class SpeechLogDto {
  @ApiProperty({ type: [SpeechAttemptDto], maxItems: 500 })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => SpeechAttemptDto)
  attempts!: SpeechAttemptDto[];
}
