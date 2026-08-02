import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';

describe('MenuController', () => {
  let controller: MenuController;

  const menuService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuController],
      providers: [{ provide: MenuService, useValue: menuService }],
    }).compile();

    controller = module.get<MenuController>(MenuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes AR model URLs through to the service on creation', () => {
    const dto = {
      name: 'Pizza Pepperoni',
      price: 58,
      model3dUrl: 'https://cdn.example.com/models/pizza.glb',
      iosModel3dUrl: 'https://cdn.example.com/models/pizza.usdz',
    };
    menuService.create.mockReturnValue(dto);

    expect(controller.create(dto)).toEqual(dto);
    expect(menuService.create).toHaveBeenCalledWith(dto);
  });
});
