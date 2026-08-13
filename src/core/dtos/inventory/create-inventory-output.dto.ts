import { InventoryOutputReason } from 'src/core/enums/inventory-output-reason.enum';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInvnetoryOutputDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsEnum(InventoryOutputReason)
  reason: InventoryOutputReason;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
