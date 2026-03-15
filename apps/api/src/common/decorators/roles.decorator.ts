import { SetMetadata } from '@nestjs/common';
import { Role } from '@org/shared-types';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);