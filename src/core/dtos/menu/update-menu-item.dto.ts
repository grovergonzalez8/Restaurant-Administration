import { IsOptional, IsString, IsNumber, Min, IsEnum, Matches } from "class-validator";
import { MenuStatus } from "src/core/enums/menu-status.enum";

export class UpdateMenuItemDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsString()
    @Matches(/^(https?:\/\/[^\s]+|\/[^\s]+)/, { message: 'model3dUrl debe ser una URL HTTP(S) o una ruta absoluta' })
    model3dUrl?: string;

    @IsOptional()
    @IsString()
    @Matches(/^(https?:\/\/[^\s]+|\/[^\s]+)/, { message: 'iosModel3dUrl debe ser una URL HTTP(S) o una ruta absoluta' })
    iosModel3dUrl?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @IsEnum(MenuStatus)
    @IsOptional()
    status?: MenuStatus;
}
