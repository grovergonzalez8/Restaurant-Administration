import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsNumber,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaymentMethod } from '../../enums/payment-method.enum';

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ValidateIf((dto: CreatePaymentDto) => dto.method === PaymentMethod.CASH)
  @IsDefined({ message: 'Debes ingresar el efectivo recibido' })
  @Type(() => Number)
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'El efectivo recibido debe ser un monto válido' },
  )
  @Min(0)
  @Max(99999999.99)
  receivedAmount?: number;
}
