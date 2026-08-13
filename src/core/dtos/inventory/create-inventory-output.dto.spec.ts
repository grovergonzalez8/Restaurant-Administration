import 'reflect-metadata';
import { validate } from 'class-validator';
import { InventoryOutputReason } from 'src/core/enums/inventory-output-reason.enum';
import { CreateInvnetoryOutputDto } from './create-inventory-output.dto';

describe('CreateInvnetoryOutputDto', () => {
  const itemId = '2e9ac7cf-7210-4ee4-b39b-3ea50ff94e29';

  it('accepts a classified inventory output', async () => {
    const dto = Object.assign(new CreateInvnetoryOutputDto(), {
      itemId,
      quantity: 2,
      reason: InventoryOutputReason.WASTE,
      note: 'Producto vencido',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects an output without a supported reason', async () => {
    const dto = Object.assign(new CreateInvnetoryOutputDto(), {
      itemId,
      quantity: 2,
      reason: 'other',
    });

    const properties = (await validate(dto)).map((error) => error.property);

    expect(properties).toContain('reason');
  });
});
