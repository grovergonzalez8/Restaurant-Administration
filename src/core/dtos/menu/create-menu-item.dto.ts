import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, IsEnum } from "class-validator";
import { MenuStatus } from "src/core/enums/menu-status.enum";

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

    @IsEnum(MenuStatus)
    @IsOptional()
    status?: MenuStatus;
}