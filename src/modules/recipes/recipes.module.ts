import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { RecipeItemEntity } from 'src/core/entities/recipe-item.entity';
import { AuthModule } from '../auth/auth.module';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([RecipeItemEntity, MenuItemEntity, InventoryItemEntity])],
  controllers: [RecipesController],
  providers: [RecipesService],
})
export class RecipesModule {}
