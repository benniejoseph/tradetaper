// src/files/files.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesService } from './files.service';
import { FilesController } from './files.controller'; // <-- Must be here

@Module({
  imports: [ConfigModule],
  providers: [FilesService],
  exports: [FilesService],
  controllers: [FilesController], // <-- Confirmed this line is present
})
export class FilesModule {}
