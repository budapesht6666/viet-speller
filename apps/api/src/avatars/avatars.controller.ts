import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Header,
  HttpCode,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Put,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AvatarsService } from './avatars.service.js';

/**
 * Телефон уменьшает фото до 256×256 сам, поэтому предел небольшой: больше —
 * значит, прислали не то.
 */
export const AVATAR_MAX_BYTES = 300 * 1024;
const AVATAR_TYPES = /^image\/(jpeg|png|webp)$/;

@ApiTags('avatars')
@Controller('users')
export class AvatarsController {
  constructor(private readonly avatars: AvatarsService) {}

  /** Своё фото профиля: multipart, поле `image`. */
  @Put('me/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } })
  // Лимит multer — до чтения в память: огромный файл оборвётся на входе,
  // а не после того, как займёт память целиком.
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: AVATAR_MAX_BYTES, files: 1 } }))
  set(
    @CurrentUser() userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: AVATAR_MAX_BYTES }), new FileTypeValidator({ fileType: AVATAR_TYPES })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.avatars.set(userId, file.buffer, file.mimetype);
  }

  @Delete('me/avatar')
  @HttpCode(204)
  remove(@CurrentUser() userId: string) {
    return this.avatars.remove(userId);
  }

  /** Фото человека из своей семьи. Адрес с версией — кешируется навсегда. */
  @Get(':id/avatar')
  @Header('Cache-Control', 'private, max-age=31536000, immutable')
  async get(@CurrentUser() viewerId: string, @Param('id', ParseUUIDPipe) userId: string) {
    const avatar = await this.avatars.get(viewerId, userId);
    return new StreamableFile(avatar.image, { type: avatar.type, length: avatar.image.length });
  }
}
