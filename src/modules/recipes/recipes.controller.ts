import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateRecipeItemDto } from 'src/core/dtos/recipes/create-recipe-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RecipesService } from './recipes.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @Roles('admin', 'kitchen')
  findAll() { return this.recipesService.findAll(); }

  @Get('menu/:menuItemId')
  @Roles('admin', 'kitchen')
  findByMenuItem(@Param('menuItemId') menuItemId: string) { return this.recipesService.findByMenuItem(menuItemId); }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateRecipeItemDto) { return this.recipesService.create(dto); }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) { return this.recipesService.remove(id); }
}
