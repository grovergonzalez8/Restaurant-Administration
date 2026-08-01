import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CreateUserDto } from 'src/core/dtos/users/create-user.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from 'src/core/dtos/users/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const withoutPasswordHash = <T extends { passwordHash: string }>(user: T) => {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {

    constructor(private readonly usersService: UsersService) {}

    @Get()
    @Roles('admin')
    findAll() {
        return this.usersService.findAll().then((users) => users.map(withoutPasswordHash));
    }

    @Get(':id')
    @Roles('admin')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id).then(withoutPasswordHash);
    }

    @Get('email/:email')
    @Roles('admin')
    findByEmail(@Param('email') email: string) {
        return this.usersService.findByEmail(email).then(withoutPasswordHash);
    }
    
    @Post()
    @Roles('admin')
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto).then(withoutPasswordHash);
    }

    @Put(':id')
    @Roles('admin')
    update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto).then(withoutPasswordHash);
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
