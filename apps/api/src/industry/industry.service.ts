import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Industry } from './entities/industry.entity';

const SEED_INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Manufacturing',
  'Education',
  'Professional Services',
  'Media & Entertainment',
  'Real Estate',
  'Hospitality',
  'Transportation & Logistics',
  'Non-Profit',
  'Government',
  'Other',
];

@Injectable()
export class IndustryService implements OnModuleInit {
  constructor(
    @InjectRepository(Industry)
    private industryRepository: Repository<Industry>,
  ) {}

  async onModuleInit() {
    const count = await this.industryRepository.count();
    if (count > 0) return;
    const entities = SEED_INDUSTRIES.map((name) =>
      this.industryRepository.create({ name }),
    );
    await this.industryRepository.save(entities);
  }

  findAll(): Promise<Industry[]> {
    return this.industryRepository.find({
      order: { name: 'ASC' },
      select: ['id', 'name'],
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.industryRepository.count({ where: { id } });
    return count > 0;
  }
}
