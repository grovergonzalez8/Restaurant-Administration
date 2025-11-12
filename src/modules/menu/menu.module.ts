import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItemEntity])],
  controllers: [MenuController],
  providers: [MenuService]
})
export class MenuModule {}
