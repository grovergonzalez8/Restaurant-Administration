import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from 'src/core/dtos/tables/create-table.dto';
import { UpdateTableDto } from 'src/core/dtos/tables/update-table.dto';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tables')
export class TablesController {
    constructor(private readonly tablesService: TablesService) {}

    @Get()
    @Roles('admin', 'kitchen', 'waiter')
    findAll() {
        return this.tablesService.findAll();
    }

    @Get(':id')
    @Roles('admin', 'host', 'waiter')
    findOne(@Param('id') id: string) {
        return this.tablesService.findOne(id);
    }

    @Post()
    @Roles('admin')
    create(@Body() dto: CreateTableDto) {
        return this.tablesService.create(dto);
    }

    @Put(':id')
    @Roles('admin')
    update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
        return this.tablesService.update(id, dto);
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: string) {
        return this.tablesService.remove(id);
    }
}
