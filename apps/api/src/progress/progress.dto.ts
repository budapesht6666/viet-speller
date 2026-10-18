import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsObject,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

/**
 * Событие журнала, как его шлёт телефон. Схема — та же, что ProgressEvent в
 * packages/core/src/progress.ts: сервер проверяет форму, а смысл считает
 * тем же кодом ядра.
 *
 * Один класс на оба типа с ValidateIf, а не два с дискриминатором: типов
 * всего два, и разница — три поля.
 */
export class EventDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: '2026-10-18T03:00:00.000Z' })
  @IsISO8601()
  at!: string;

  @ApiProperty({ description: 'Секунд практики', maximum: 7200 })
  @IsInt()
  @Min(0)
  @Max(7200)
  seconds!: number;

  @ApiProperty({ enum: ['lesson-done', 'review'] })
  @IsIn(['lesson-done', 'review'])
  type!: 'lesson-done' | 'review';

  @ApiPropertyOptional()
  @ValidateIf((e: EventDto) => e.type === 'lesson-done')
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional({ description: 'Оценка по элементам: id → 1..3' })
  @ValidateIf((e: EventDto) => e.type === 'lesson-done')
  @IsObject()
  grades?: Record<string, 1 | 2 | 3>;

  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  @ValidateIf((e: EventDto) => e.type === 'lesson-done')
  @IsNumber()
  @Min(0)
  @Max(1)
  accuracy?: number;

  @ApiPropertyOptional()
  @ValidateIf((e: EventDto) => e.type === 'lesson-done')
  @IsBoolean()
  mic?: boolean;

  @ApiPropertyOptional()
  @ValidateIf((e: EventDto) => e.type === 'review')
  @IsString()
  itemId?: string;

  @ApiPropertyOptional({ enum: [1, 2, 3] })
  @ValidateIf((e: EventDto) => e.type === 'review')
  @IsIn([1, 2, 3])
  grade?: 1 | 2 | 3;
}

export class SyncDto {
  @ApiProperty({ description: 'Курсор: seq последнего события, которое телефон уже получил с сервера' })
  @IsInt()
  @Min(0)
  since!: number;

  @ApiProperty({ type: [EventDto] })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  events!: EventDto[];
}
