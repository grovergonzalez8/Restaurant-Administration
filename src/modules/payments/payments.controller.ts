import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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

  @Get('order/:orderId/receipt')
  @Roles('admin', 'waiter')
  findReceipt(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Req() request: { user: UserEntity },
  ) {
    return this.paymentsService.findReceipt(orderId, request.user);
  }

  @Post()
  @Roles('admin', 'waiter')
  create(@Body() dto: CreatePaymentDto, @Req() request: { user: UserEntity }) {
    return this.paymentsService.create(dto, request.user);
  }
}
