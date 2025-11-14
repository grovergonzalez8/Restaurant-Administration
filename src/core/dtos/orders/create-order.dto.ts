import { Type } from "class-transformer";
import { IsUUID, IsInt, Min, IsNotEmpty, IsArray, ValidateNested } from "class-validator";

class OrderItemInput {
    @IsUUID()
    menuItemId: string;

    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemInput)
    items: OrderItemInput[];
}