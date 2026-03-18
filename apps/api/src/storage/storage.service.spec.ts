import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let s3Provider: jest.Mocked<S3StorageProvider>;

  beforeEach(async () => {
    const mockS3Provider = {
      upload: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: S3StorageProvider,
          useValue: mockS3Provider,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    s3Provider = module.get(S3StorageProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    const validFile = {
      buffer: Buffer.from('test'),
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    } as Express.Multer.File;

    it('should throw BadRequestException when no file provided', async () => {
      await expect(service.upload(undefined, 'documents')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.upload(undefined, 'documents')).rejects.toThrow(
        'No file provided'
      );
    });

    it('should throw BadRequestException when file exceeds 10MB', async () => {
      const largeFile = {
        ...validFile,
        size: 11 * 1024 * 1024,
      } as Express.Multer.File;

      await expect(service.upload(largeFile, 'documents')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.upload(largeFile, 'documents')).rejects.toThrow(
        'File size exceeds 10MB'
      );
    });

    it('should throw BadRequestException when file type not allowed', async () => {
      const invalidFile = {
        ...validFile,
        mimetype: 'application/zip',
      } as Express.Multer.File;

      await expect(service.upload(invalidFile, 'documents')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.upload(invalidFile, 'documents')).rejects.toThrow(
        'File type not allowed'
      );
    });

    it('should delegate to S3StorageProvider when validation passes', async () => {
      const result = { url: 'https://example.com/file.pdf', key: 'documents/abc.pdf' };
      s3Provider.upload.mockResolvedValue(result);

      const uploadResult = await service.upload(validFile, 'documents');

      expect(s3Provider.upload).toHaveBeenCalledWith(validFile, 'documents');
      expect(uploadResult).toEqual(result);
    });
  });

  describe('delete', () => {
    it('should delegate to S3StorageProvider', async () => {
      s3Provider.delete.mockResolvedValue(undefined);

      await service.delete('documents/abc.pdf');

      expect(s3Provider.delete).toHaveBeenCalledWith('documents/abc.pdf');
    });
  });
});
