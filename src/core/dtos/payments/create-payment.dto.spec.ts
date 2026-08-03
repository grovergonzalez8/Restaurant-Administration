import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaymentMethod } from '../../enums/payment-method.enum';
import { CreatePaymentDto } from './create-payment.dto';

describe('CreatePaymentDto', () => {
  const orderId = '2e9ac7cf-7210-4ee4-b39b-3ea50ff94e29';

  it('requires the received amount for cash payments', async () => {
    const dto = plainToInstance(CreatePaymentDto, {
      orderId,
      method: PaymentMethod.CASH,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'receivedAmount')).toBe(
      true,
    );
  });

  it('allows non-cash payments without a received amount', async () => {
    const dto = plainToInstance(CreatePaymentDto, {
      orderId,
      method: PaymentMethod.CARD,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
