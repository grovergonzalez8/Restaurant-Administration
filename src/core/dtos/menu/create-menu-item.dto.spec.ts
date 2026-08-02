import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateMenuItemDto } from './create-menu-item.dto';

describe('CreateMenuItemDto', () => {
  const baseItem = {
    name: 'Hamburguesa Clásica',
    price: 42,
  };

  it('accepts HTTPS URLs for Android and iOS AR models', async () => {
    const dto = plainToInstance(CreateMenuItemDto, {
      ...baseItem,
      model3dUrl: 'https://cdn.example.com/models/hamburguesa.glb',
      iosModel3dUrl: 'https://cdn.example.com/models/hamburguesa.usdz',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts an absolute route for a locally hosted Android model', async () => {
    const dto = plainToInstance(CreateMenuItemDto, {
      ...baseItem,
      model3dUrl: '/models/hamburguesa.glb',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects AR model URLs that are neither HTTP(S) URLs nor absolute routes', async () => {
    const dto = plainToInstance(CreateMenuItemDto, {
      ...baseItem,
      model3dUrl: 'ftp://cdn.example.com/models/hamburguesa.glb',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('model3dUrl');
  });
});
