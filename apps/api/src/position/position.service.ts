import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Position } from './entities/position.entity';
import { Repository, UpdateResult } from 'typeorm';
import { NewPositionDto } from './dto/position.dto';

@Injectable()
export class PositionService {
  constructor(
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>
  ) {}

  async createPosition(
    departmentId: string,
    position: NewPositionDto
  ): Promise<Position> {
    const newPosition = this.positionRepository.create({
      name: position.name,
      description: position.description,
      department: { id: departmentId },
    });
    return await this.positionRepository.save(newPosition);
  }

  async updatePosition(
    id: string,
    position: NewPositionDto
  ): Promise<UpdateResult> {
    const updatedPosition = await this.positionRepository.update(id, position);
    if (updatedPosition.affected === 0) {
      throw new NotFoundException('Position not found');
    }
    return updatedPosition;
  }

  async deletePosition(id: string): Promise<void> {
    await this.positionRepository.delete(id);
  }

  async getDepartmentPositions(departmentId: string): Promise<Position[]> {
    return await this.positionRepository.find({
      where: { department: { id: departmentId } },
    });
  }

  async getOrganizationPositions(organizationId: string): Promise<Position[]> {
    return await this.positionRepository.find({
      where: { department: { organization: { id: organizationId } } },
      relations: ['department', 'department.organization'],
    });
  }
}
