import { IsOptional, IsString, IsNumber, Min, IsBoolean, IsEnum } from "class-validator";
import { MenuStatus } from "src/core/enums/menu-status.enum";

export class UpdateMenuItemDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @IsEnum(MenuStatus)
    @IsOptional()
    status?: MenuStatus;
}