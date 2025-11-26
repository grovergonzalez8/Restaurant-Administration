import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateInvnentoryItemDto {
    @IsOptional()
    @IsString()
    name?: string;
    
    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    quantity?: number;
    
    @IsOptional()
    @IsString()
    unit?: string;
}