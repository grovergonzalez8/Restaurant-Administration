import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  IsNumber,
  IsUUID,
  Min,
  ArrayMinSize,
  Equals,
  IsOptional,
} from 'class-validator';
import { OrderStatus } from 'src/core/enums/order-status.enum';

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

  @IsOptional()
  @IsUUID()
  reservationId?: string;

  @IsOptional()
  @Equals(OrderStatus.PENDING)
  status?: OrderStatus.PENDING;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
