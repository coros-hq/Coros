import { Module } from '@nestjs/common';
import { PositionController } from './position.controller';
import { PositionService } from './position.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Position } from './entities/position.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Position])],
    controllers: [PositionController],
    providers: [PositionService],
    exports: [PositionService],
})
export class PositionModule {}
