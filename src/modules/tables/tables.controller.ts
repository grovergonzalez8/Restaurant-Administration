import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from 'src/core/dtos/tables/create-table.dto';
import { UpdateTableDto } from 'src/core/dtos/tables/update-table.dto';

@Controller('tables')
export class TablesController {
    constructor(private readonly tablesService: TablesService) {}

    @Get()
    findAll() {
        return this.tablesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tablesService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateTableDto) {
        return this.tablesService.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
        return this.tablesService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.tablesService.remove(id);
    }
}
