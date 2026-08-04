import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from 'src/core/dtos/login/login.dto';
import { UserEntity } from 'src/core/entities/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';

const withoutSensitiveAuthData = <
  T extends { passwordHash?: string; sessionVersion?: number },
>(
  user: T,
) => {
  const safeUser = { ...user };
  delete safeUser.passwordHash;
  delete safeUser.sessionVersion;
  return safeUser;
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    const result = await this.authService.login(dto);
    return { ...result, user: withoutSensitiveAuthData(result.user) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@Request() req: { user: UserEntity }) {
    return withoutSensitiveAuthData(req.user);
  }
}
