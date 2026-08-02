import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CreateReservationDto } from 'src/core/dtos/reservations/create-reservation.dto';
import { UpdateReservationStatusDto } from 'src/core/dtos/reservations/update-reservation-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ReservationsService } from './reservations.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @Roles('admin', 'host')
  findAll() { return this.reservationsService.findAll(); }

  @Get('upcoming')
  @Roles('admin', 'host', 'waiter')
  findUpcoming() { return this.reservationsService.findUpcoming(); }

  @Post()
  @Roles('admin', 'host')
  create(@Body() dto: CreateReservationDto) { return this.reservationsService.create(dto); }

  @Put(':id/status')
  @Roles('admin', 'host')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReservationStatusDto) { return this.reservationsService.updateStatus(id, dto); }

  @Delete(':id')
  @Roles('admin', 'host')
  remove(@Param('id') id: string) { return this.reservationsService.remove(id); }
}
