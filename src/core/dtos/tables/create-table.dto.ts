import { IsInt, IsOptional, IsIn, Min } from 'class-validator';
import { TableStatus } from 'src/core/enums/table-status.enum';

export class CreateTableDto {
  @IsInt()
  @Min(1)
  number: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsIn([TableStatus.FREE, TableStatus.OUT_OF_SERVICE])
  @IsOptional()
  status?: TableStatus;
}
