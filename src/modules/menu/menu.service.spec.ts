import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { MenuService } from './menu.service';

describe('MenuService', () => {
  let service: MenuService;

  const menuRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        {
          provide: getRepositoryToken(MenuItemEntity),
          useValue: menuRepository,
        },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('persists the Android and iOS AR model URLs when creating a menu item', async () => {
    const dto = {
      name: 'Hamburguesa Clásica',
      price: 42,
      model3dUrl: 'https://cdn.example.com/models/hamburguesa.glb',
      iosModel3dUrl: 'https://cdn.example.com/models/hamburguesa.usdz',
    };
    const entity = { id: 'menu-item-id', ...dto };
    menuRepository.create.mockReturnValue(entity);
    menuRepository.save.mockResolvedValue(entity);

    await expect(service.create(dto)).resolves.toEqual(entity);

    expect(menuRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model3dUrl: dto.model3dUrl,
        iosModel3dUrl: dto.iosModel3dUrl,
      }),
    );
  });
});
