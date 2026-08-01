import { IsNumber, IsUUID, Min } from 'class-validator';

export class CreateRecipeItemDto {
  @IsUUID()
  menuItemId: string;

  @IsUUID()
  inventoryItemId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;
}
