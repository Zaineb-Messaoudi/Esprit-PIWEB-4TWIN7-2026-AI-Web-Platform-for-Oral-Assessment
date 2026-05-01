import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from 'src/common/role.decorator';
import { RolesGuard } from '../common/guards/role.guards';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getUsers(@Query('role') role?: string) {
    return this.adminService.getAllUsers(role);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.updateStatus(id, isActive);
  }

  @Patch('users/:id/role')
  changeRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    return this.adminService.changeRole(id, role);
  }
}