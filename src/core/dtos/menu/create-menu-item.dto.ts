import { IsNotEmpty, IsString, IsOptional, IsNumber, Min } from "class-validator";

export class CreateMenuItemDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    isAvailable?: boolean;
}