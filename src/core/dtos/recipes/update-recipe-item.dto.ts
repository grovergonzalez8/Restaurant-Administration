import { IsNumber, Min } from 'class-validator';

export class UpdateRecipeItemDto {
  @IsNumber()
  @Min(0.01)
  quantity: number;
}
