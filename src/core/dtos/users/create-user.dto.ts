import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @MinLength(6)
    password: string;

    @IsOptional()
    @IsInt()
    roleId?: number;

    @IsOptional()
    @IsString()
    phone?: string;
}
