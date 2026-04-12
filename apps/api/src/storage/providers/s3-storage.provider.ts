import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class S3StorageProvider {
  private readonly s3Client: S3;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.getOrThrow<string>('STORAGE_ENDPOINT');
    this.bucket = this.configService.getOrThrow<string>('STORAGE_BUCKET');

    this.s3Client = new S3({
      endpoint: this.endpoint,
      region: this.configService.getOrThrow<string>('STORAGE_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('STORAGE_ACCESS_KEY'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'STORAGE_SECRET_KEY'
        ),
      },
      forcePathStyle: true,
      // Supabase Storage can return transient errors right after a project wakes from pause.
      maxAttempts: 6,
    });
  }

  private isTransientSupabaseStorageError(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err);
    const name =
      err !== null &&
      typeof err === 'object' &&
      'name' in err &&
      typeof (err as { name: unknown }).name === 'string'
        ? (err as { name: string }).name
        : '';
    return (
      name === 'DatabaseTimeout' ||
      message.includes('DatabaseTimeout') ||
      message.includes('connection to the database')
    );
  }

  async upload(
    file: Express.Multer.File,
    folder: string
  ): Promise<{ url: string; key: string }> {
    const ext = file.originalname.includes('.')
      ? '.' + file.originalname.split('.').pop()
      : '';
    const filename = `${randomUUID()}${ext}`;
    const key = `${folder}/${filename}`;

    const putCommand = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await this.s3Client.send(putCommand);
        break;
      } catch (err) {
        if (
          !this.isTransientSupabaseStorageError(err) ||
          attempt === 4
        ) {
          throw err;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(1000 * 2 ** attempt, 8000))
        );
      }
    }

    const projectUrl = this.endpoint.replace('/storage/v1/s3', '');
    const url = `${projectUrl}/storage/v1/object/public/${this.bucket}/${key}`;
    return { url, key };
  }

  async delete(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }
}
