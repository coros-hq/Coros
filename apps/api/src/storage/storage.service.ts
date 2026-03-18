import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { S3StorageProvider } from './providers/s3-storage.provider';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

@Injectable()
export class StorageService {
  constructor(private readonly s3StorageProvider: S3StorageProvider) {}

  async upload(
    file: Express.Multer.File | undefined,
    folder: string
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 10MB');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
      throw new BadRequestException('File type not allowed');
    }

    return this.s3StorageProvider.upload(file, folder);
  }

  async delete(key: string): Promise<void> {
    return this.s3StorageProvider.delete(key);
  }
}
