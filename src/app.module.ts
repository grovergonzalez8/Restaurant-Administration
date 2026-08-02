import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './shared/infra/database/typeorm.config';
import { UsersModule } from './modules/users/users.module';
import { MenuModule } from './modules/menu/menu.module';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from './modules/orders/orders.module';
import { TablesModule } from './modules/tables/tables.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { CashSessionsModule } from './modules/cash-sessions/cash-sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env', 
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    UsersModule,
    MenuModule,
    OrdersModule,
    TablesModule,
    KitchenModule,
    InventoryModule,
    AuthModule,
    RolesModule,
    DashboardModule,
    PaymentsModule,
    ReservationsModule,
    RecipesModule,
    ReportsModule,
    RealtimeModule,
    CashSessionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
