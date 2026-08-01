import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/core/dtos/users/create-user.dto';
import { LoginUserDto } from 'src/core/dtos/login/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

const withoutPasswordHash = <T extends { passwordHash: string }>(user: T) => {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
};

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

    @Post('register')
    async register(@Body() dto: CreateUserDto) {
        return withoutPasswordHash(
            await this.authService.register({ ...dto, roleId: undefined }),
        );
    }

    @Post('login')
    async login(@Body() dto: LoginUserDto) {
        const result = await this.authService.login(dto);
        return { ...result, user: withoutPasswordHash(result.user) };
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async profile(@Request() req) {
        return withoutPasswordHash(req.user);
    }
}
