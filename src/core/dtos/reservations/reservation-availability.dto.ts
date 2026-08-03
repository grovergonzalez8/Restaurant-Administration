import { IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReservationAvailabilityDto {
  @IsDateString()
  reservationAt: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests: number;
}
