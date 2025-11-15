import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateKitchenOrderDto {
    @IsUUID()
    @IsNotEmpty()
    orderID: string;
}