import { IsOptional, IsString, IsNumber, Min, IsBoolean } from "class-validator";

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

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;
}