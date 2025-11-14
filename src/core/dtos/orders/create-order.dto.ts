import { Type } from "class-transformer";
import { IsNotEmpty, IsArray, ValidateNested, IsNumber, IsEnum } from "class-validator";
import { OrderStatus } from "src/core/enums/order-status.enum";

class OrderItemDto {
    @IsNotEmpty()
    menuItemId: string;

    @IsNumber()
    quantity: number;
}

export class CreateOrderDto {
    @IsNumber()
    tableNumber: number;

    @IsEnum(OrderStatus)
    status: OrderStatus;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
}