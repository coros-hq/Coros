import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { Department } from './entities/department.entity';
import { NewDepartmentDto } from './dto/new-department.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@org/shared-types';

@Controller('departments')
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) {}

    @Post("/add")
    @UseGuards(JwtAuthGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    async createDepartment(@CurrentUser('organizationId') organizationId: string, @Body() department: NewDepartmentDto): Promise<Department> {
        return this.departmentService.createDepartment(organizationId, department);
    }

    @Patch('/update/:id')
    @UseGuards(JwtAuthGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    async updateDepartment(@Param('id') id: string, @Body() department: NewDepartmentDto): Promise<{ message: string }> {
        return this.departmentService.updateDepartment(id, department);
    }

    @Delete('/delete/:id')
    @UseGuards(JwtAuthGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    async deleteDepartment(@Param('id') id: string): Promise<{ message: string }> {
        await this.departmentService.deleteDepartment(id);
        return { message: 'Department deleted successfully' };
    }

    @Get('all')
    @UseGuards(JwtAuthGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    async getOrganizationDepartments(@CurrentUser('organizationId') organizationId: string): Promise<Department[]> {
        return this.departmentService.getOrganizationDepartments(organizationId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    async getDepartmentById(@Param('id') id: string): Promise<Department> {
        return this.departmentService.getDepartmentById(id);
    }
}
