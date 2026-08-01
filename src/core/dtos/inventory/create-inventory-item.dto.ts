import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateInventoryItemDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    quantity: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minStock?: number;

    @IsNotEmpty()
    @IsString()
    unit: string;
}
