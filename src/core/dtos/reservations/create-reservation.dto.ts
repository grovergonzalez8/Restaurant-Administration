import { IsDateString, IsEmail, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  tableId: string;

  @IsString()
  customerName: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsInt()
  @Min(1)
  guests: number;

  @IsDateString()
  reservationAt: string;

  @IsOptional()
  @IsString()
  note?: string;
}
