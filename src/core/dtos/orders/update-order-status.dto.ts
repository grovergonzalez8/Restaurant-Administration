import { IsNotEmpty, IsIn } from "class-validator";

export class UpdateOrderStatusDto {
    @IsNotEmpty()
    @IsIn(['pending', 'preparing', 'delivered', 'cancelled'])
    status: 'pending' | 'preparing' | 'delivered' | 'cancelled';
}