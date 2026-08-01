import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CreatePaymentDto } from 'src/core/dtos/payments/create-payment.dto';
import { UserEntity } from 'src/core/entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaymentsService } from './payments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Roles('admin')
  findAll() {
    return this.paymentsService.findAll();
  }

  @Post()
  @Roles('admin', 'waiter')
  create(@Body() dto: CreatePaymentDto, @Req() request: { user: UserEntity }) {
    return this.paymentsService.create(dto, request.user);
  }
}
