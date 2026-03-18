import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../common/guards/roles.guard';
import { User } from '../user/entities/user.entity';
import { Organization } from '../organization/entities/organization.entity';
import { RefreshToken } from '../auth/entities/refreshToken.entity';
import { Industry } from '../industry/entities/industry.entity';
import { IndustryModule } from '../industry/industry.module';
import { ContractModule } from '../contract/contract.module';
import { LeaveBalanceModule } from '../leave-balance/leave-balance.module';
import { LeaveRequestModule } from '../leave-request/leave-request.module';
import { Employee } from '../employee/entities/employee.entity';
import { LeaveRequest } from '../leave-request/entities/leave-request.entity';
import { Contract } from '../contract/entities/contract.entity';
import { LeaveBalance } from '../leave-balance/entities/leave-balance.entity';
import { Department } from '../department/entities/department.entity';
import { DepartmentModule } from '../department/department.module';
import { Position } from '../position/entities/position.entity';
import { UsersModule } from '../user/user.module';
import { PositionModule } from '../position/position.module';
import { EmployeeModule } from '../employee/employee.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    AuthModule,
    IndustryModule,
    ContractModule,
    LeaveBalanceModule,
    LeaveRequestModule,
    UsersModule,
    DepartmentModule,
    PositionModule,
    EmployeeModule,
    StorageModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: Number(configService.get<number>('POSTGRES_PORT')) || 5433,
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        entities: [
          User,
          Organization,
          RefreshToken,
          Industry,
          Employee,
          LeaveRequest,
          Contract,
          LeaveBalance,
          Department,
          Position,
        ],
        synchronize: true,
      }),
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
