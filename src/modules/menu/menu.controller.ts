import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from 'src/core/dtos/menu/create-menu-item.dto';
import { UpdateMenuItemDto } from 'src/core/dtos/menu/update-menu-item.dto';

@Controller('menu')
export class MenuController {
    constructor(private readonly menuService: MenuService) {}

    @Post()
    create(@Body() dto: CreateMenuItemDto) {
        return this.menuService.create(dto);
    }

    @Get()
    findAll() {
        return this.menuService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.menuService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
        return this.menuService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.menuService.remove(id);
    }
}
