import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CloseCashSessionDto } from 'src/core/dtos/cash-sessions/close-cash-session.dto';
import { OpenCashSessionDto } from 'src/core/dtos/cash-sessions/open-cash-session.dto';
import { UserEntity } from 'src/core/entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CashSessionsService } from './cash-sessions.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash-sessions')
export class CashSessionsController {
  constructor(private readonly sessionsService: CashSessionsService) {}

  @Get()
  @Roles('admin')
  findAll() {
    return this.sessionsService.findAll();
  }

  @Get('current')
  @Roles('admin', 'waiter')
  findCurrent(@Req() request: { user: UserEntity }) {
    return this.sessionsService.findCurrent(request.user.id);
  }

  @Post('open')
  @Roles('admin', 'waiter')
  open(@Body() dto: OpenCashSessionDto, @Req() request: { user: UserEntity }) {
    return this.sessionsService.open(dto, request.user);
  }

  @Get(':id/summary')
  @Roles('admin', 'waiter')
  summary(@Param('id') id: string, @Req() request: { user: UserEntity }) {
    return this.sessionsService.summary(id, request.user);
  }

  @Post(':id/close')
  @Roles('admin', 'waiter')
  close(
    @Param('id') id: string,
    @Body() dto: CloseCashSessionDto,
    @Req() request: { user: UserEntity },
  ) {
    return this.sessionsService.close(id, dto, request.user);
  }
}
