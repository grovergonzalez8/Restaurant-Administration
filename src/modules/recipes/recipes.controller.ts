import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CreateRecipeItemDto } from 'src/core/dtos/recipes/create-recipe-item.dto';
import { UpdateRecipeItemDto } from 'src/core/dtos/recipes/update-recipe-item.dto';
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
  findAll() {
    return this.recipesService.findAll();
  }

  @Get('menu/availability')
  @Roles('admin', 'kitchen', 'waiter')
  menuAvailability() {
    return this.recipesService.menuAvailability();
  }

  @Get('menu/:menuItemId')
  @Roles('admin', 'kitchen')
  findByMenuItem(@Param('menuItemId', ParseUUIDPipe) menuItemId: string) {
    return this.recipesService.findByMenuItem(menuItemId);
  }

  @Get('menu/:menuItemId/availability')
  @Roles('admin', 'kitchen', 'waiter')
  availability(@Param('menuItemId', ParseUUIDPipe) menuItemId: string) {
    return this.recipesService.availability(menuItemId);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateRecipeItemDto) {
    return this.recipesService.create(dto);
  }

  @Put(':id')
  @Roles('admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecipeItemDto,
  ) {
    return this.recipesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.recipesService.remove(id);
  }
}
