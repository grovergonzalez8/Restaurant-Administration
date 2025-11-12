import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateUserDto {
    
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @MinLength(6)
    password: string;

    @IsNotEmpty()
    @IsString()
    role: string;
}