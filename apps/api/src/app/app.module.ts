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
import { OrganizationsModule } from '../organization/organizations.module';
import { ProjectModule } from '../project/project.module';
import { TaskModule } from '../task/task.module';
import { DocumentModule } from '../document/document.module';
import { Document } from '../document/entities/document.entity';
import { SearchModule } from '../search/search.module';
import { NotificationModule } from '../notification/notification.module';
import { Notification } from '../notification/entities/notification.entity';
import { InviteModule } from '../invite/invite.module';
import { EmailModule } from '../email/email.module';
import { EmployeeInviteToken } from '../invite/entities/employee-invite-token.entity';
import { Project } from '../project/entities/project.entity';
import { ProjectKanbanColumn } from '../project/entities/project-kanban-column.entity';
import { ProjectMember } from '../project/entities/project-member.entity';
import { Task } from '../task/entities/task.entity';
import { TaskComment } from '../task/entities/task-comment.entity';
import { AnnouncementModule } from '../announcement/announcement.module';
import { Announcement } from '../announcement/entities/announcement.entity';
import { AnnouncementRead } from '../announcement/entities/announcement-read.entity';

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
    OrganizationsModule,
    ProjectModule,
    TaskModule,
    DocumentModule,
    SearchModule,
    NotificationModule,
    InviteModule,
    EmailModule,
    AnnouncementModule,
    ConfigModule.forRoot({
      isGlobal: true,
      // Nx runs from repo root; env files often live under apps/api/
      envFilePath: ['.env.local', 'apps/api/.env.local', '.env', 'apps/api/.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProd = process.env.NODE_ENV === 'production';
        const devDefaults = !isProd;
        return {
          type: 'postgres' as const,
          host:
            configService.get<string>('POSTGRES_HOST') ??
            (devDefaults ? 'localhost' : undefined),
          port: Number(configService.get<number>('POSTGRES_PORT')) || 5432,
          username:
            configService.get<string>('POSTGRES_USER') ??
            (devDefaults ? 'coros' : undefined),
          password:
            configService.get<string>('POSTGRES_PASSWORD') ??
            (devDefaults ? 'password' : undefined),
          database:
            configService.get<string>('POSTGRES_DB') ??
            (devDefaults ? 'coros_db' : undefined),
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
            Project,
            ProjectKanbanColumn,
            ProjectMember,
            Task,
            TaskComment,
            Document,
            Notification,
            EmployeeInviteToken,
            Announcement,
            AnnouncementRead,
          ],
          synchronize: true,
        };
      },
    }),
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
