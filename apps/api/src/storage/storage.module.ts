import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { StorageService } from './storage.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [S3StorageProvider, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
