import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RolesService } from './roles.service';
import { Roles } from '../auth/roles.decorator';
import { CreateRoleDto } from 'src/core/dtos/roles/create-role.dto';
import { UpdateRoleDto } from 'src/core/dtos/roles/update-role.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @Get()
    @Roles('admin')
    findAll() {
        return this.rolesService.findAll();
    }

    @Get(':id')
    @Roles('admin')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.rolesService.findOne(id);
    }

    @Get(':name')
    @Roles('admin')
    findByName(@Param('name') name: string) {
        return this.rolesService.findByName(name);
    }

    @Post()
    @Roles('admin')
    create(@Body() dto: CreateRoleDto) {
        return this.rolesService.create(dto);
    }

    @Put(':id')
    @Roles('admin')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
        return this.rolesService.update(id, dto);
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.rolesService.remove(id);
    }
}
