import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from "class-validator";

export class CreateInvnetoryOutputDto {
    @IsUUID()
    @IsNotEmpty()
    itemId: string;

    @IsNumber()
    @Min(0.01)
    quantity: number;

    @IsOptional()
    note?: string;
}