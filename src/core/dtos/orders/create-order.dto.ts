import { Type } from "class-transformer";
import { IsNotEmpty, IsArray, ValidateNested, IsNumber, IsEnum, IsUUID, Min, ArrayMinSize, IsOptional } from "class-validator";
import { OrderStatus } from "src/core/enums/order-status.enum";

class OrderItemDto {
    @IsUUID()
    menuItemId: string;

    @IsNumber()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @IsUUID()
    tableId: string;

    @IsEnum(OrderStatus)
    @IsOptional()
    status?: OrderStatus;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
}
