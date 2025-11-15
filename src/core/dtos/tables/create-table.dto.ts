import { IsNumber, IsOptional, IsEnum } from "class-validator";
import { TableStatus } from "src/core/enums/table-status.enum";

export class CreateTableDto {
    @IsNumber()
    number: number;

    @IsNumber()
    @IsOptional()
    capacity?: number;

    @IsEnum(TableStatus)
    @IsOptional()
    status?: TableStatus;
}