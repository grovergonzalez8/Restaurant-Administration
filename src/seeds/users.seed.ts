import { INestApplicationContext, NotFoundException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { CreateUserDto } from 'src/core/dtos/users/create-user.dto';
import { UserEntity } from 'src/core/entities/user.entity';
import { RolesService } from 'src/modules/roles/roles.service';
import { UsersService } from 'src/modules/users/users.service';

type SeedUser = {
  name: string;
  email: string;
  password: string;
  phone: string;
  roleName: string;
};

export async function seedUsers(app?: INestApplicationContext) {
  let createdContext = false;

  if (!app) {
    app = await NestFactory.createApplicationContext(AppModule);
    createdContext = true;
  }

  const rolesService: RolesService = app.get(RolesService);
  const usersService: UsersService = app.get(UsersService);

  const users: SeedUser[] = [
    {
      name: 'Admin Sistema',
      email: 'grovergonzalez8@gmail.com',
      password: 'Admin123*',
      phone: '64858084',
      roleName: 'admin',
    },
    {
      name: 'Cocinero 1',
      email: 'kitchen@restaurant.test',
      password: 'Kitchen123*',
      phone: '64858085',
      roleName: 'kitchen',
    },
    {
      name: 'Mesero 1',
      email: 'waiter@restaurant.test',
      password: 'Waiter123*',
      phone: '64858086',
      roleName: 'waiter',
    },
  ];

  for (const userData of users) {
    try {
      let existing: UserEntity | null = null;
      try {
        existing = await usersService.findByEmail(userData.email);
      } catch (error) {
        if (!(error instanceof NotFoundException)) throw error;
      }

      let role = await rolesService.findByName(userData.roleName);

      if (!role) {
        try {
          const created = await rolesService.create({
            name: userData.roleName,
            description: `${userData.roleName} seed`,
          });
          role = created;
          console.log(
            `Rol '${userData.roleName}' creado exitosamente para el usuario '${userData.email}'.`,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          console.error(
            `Error al crear el rol '${userData.roleName}' para el usuario '${userData.email}':`,
            message,
          );
          role = await rolesService.findByName(userData.roleName);
        }
      }
      if (!role) {
        throw new Error(`No se pudo resolver el rol '${userData.roleName}'`);
      }

      if (existing) {
        if (existing.role?.id !== role.id) {
          await usersService.update(existing.id, { roleId: role.id });
          console.log(`Rol corregido para: ${userData.email}`);
        } else {
          console.log(`Usuario existente, skip: ${userData.email}`);
        }
        continue;
      }

      const dto: CreateUserDto = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        roleId: role.id,
      };

      await usersService.create(dto);
      console.log(`Usuario '${userData.name}' creado exitosamente.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error al crear el usuario '${userData.name}':`, message);
    }
  }
  if (createdContext) {
    await app.close();
  }
}
