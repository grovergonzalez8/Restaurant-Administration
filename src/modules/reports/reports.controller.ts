import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportPeriodDto } from 'src/core/dtos/reports/report-period.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
@Roles('admin')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  sales(@Query() period: ReportPeriodDto) { return this.reportsService.sales(period); }

  @Get('top-products')
  topProducts(@Query() period: ReportPeriodDto) { return this.reportsService.topProducts(period); }

  @Get('inventory')
  inventory(@Query() period: ReportPeriodDto) { return this.reportsService.inventory(period); }
}
