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
    });
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

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const url = `${this.endpoint}/${this.bucket}/${key}`;
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
