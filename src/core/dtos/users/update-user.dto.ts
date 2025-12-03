import { IsOptional, IsEmail, IsString, MinLength } from "class-validator";

export class UpdateUserDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @MinLength(6)
    password?: string;

    @IsOptional()
    @IsString()
    roleId?: number;
}