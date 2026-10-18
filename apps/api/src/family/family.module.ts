import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { FamilyController } from './family.controller.js';
import { FamilyService } from './family.service.js';

@Module({
  imports: [UsersModule],
  providers: [FamilyService],
  controllers: [FamilyController],
  exports: [FamilyService],
})
export class FamilyModule {}
