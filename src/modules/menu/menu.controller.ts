import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from 'src/core/dtos/menu/create-menu-item.dto';
import { UpdateMenuItemDto } from 'src/core/dtos/menu/update-menu-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('menu')
export class MenuController {
    constructor(private readonly menuService: MenuService) {}

    @Get()
    findAll() {
        return this.menuService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.menuService.findOne(id);
    }
    
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    @Roles('admin')
    create(@Body() dto: CreateMenuItemDto) {
        return this.menuService.create(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put(':id')
    @Roles('admin')
    update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
        return this.menuService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: string) {
        return this.menuService.remove(id);
    }
}
