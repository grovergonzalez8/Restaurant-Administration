import 'reflect-metadata';
import { validate } from 'class-validator';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { CreateTableDto } from './create-table.dto';

describe('CreateTableDto', () => {
  it('accepts a positive table configuration', async () => {
    const dto = Object.assign(new CreateTableDto(), {
      number: 8,
      capacity: 6,
      status: TableStatus.FREE,
    });

    expect(await validate(dto)).toEqual([]);
  });

  it('rejects occupied state and non-positive values from admin input', async () => {
    const dto = Object.assign(new CreateTableDto(), {
      number: 0,
      capacity: 2.5,
      status: TableStatus.OCCUPIED,
    });

    const properties = (await validate(dto)).map((error) => error.property);

    expect(properties).toEqual(
      expect.arrayContaining(['number', 'capacity', 'status']),
    );
  });
});
