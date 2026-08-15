import { INestApplicationContext, NotFoundException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { isEmail } from 'class-validator';
import { AppModule } from 'src/app.module';
import { UserEntity } from 'src/core/entities/user.entity';
import { RolesService } from 'src/modules/roles/roles.service';
import { UsersService } from 'src/modules/users/users.service';

type BootstrapEnvironment = Partial<
  Record<
    | 'BOOTSTRAP_ADMIN_NAME'
    | 'BOOTSTRAP_ADMIN_EMAIL'
    | 'BOOTSTRAP_ADMIN_PASSWORD'
    | 'BOOTSTRAP_ADMIN_PHONE',
    string
  >
>;

type BootstrapAdmin = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

export function getBootstrapAdmin(
  env: BootstrapEnvironment = process.env,
): BootstrapAdmin | null {
  const name = env.BOOTSTRAP_ADMIN_NAME?.trim();
  const email = env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.BOOTSTRAP_ADMIN_PASSWORD;
  const phone = env.BOOTSTRAP_ADMIN_PHONE?.trim();
  const configured = [name, email, password, phone].some(Boolean);

  if (!configured) return null;
  if (!name || !email || !password) {
    throw new Error(
      'BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL y BOOTSTRAP_ADMIN_PASSWORD son obligatorios',
    );
  }
  if (!isEmail(email)) {
    throw new Error('BOOTSTRAP_ADMIN_EMAIL no es válido');
  }
  if (password.length < 12) {
    throw new Error(
      'BOOTSTRAP_ADMIN_PASSWORD debe tener al menos 12 caracteres',
    );
  }

  return { name, email, password, ...(phone ? { phone } : {}) };
}

export async function seedUsers(
  app?: INestApplicationContext,
  env: BootstrapEnvironment = process.env,
) {
  const admin = getBootstrapAdmin(env);
  if (!admin) {
    console.log('Bootstrap de administrador omitido: no fue configurado');
    return;
  }

  let createdContext = false;
  if (!app) {
    app = await NestFactory.createApplicationContext(AppModule);
    createdContext = true;
  }

  try {
    const rolesService = app.get(RolesService);
    const usersService = app.get(UsersService);
    const adminRole = await rolesService.findByName('admin');
    if (!adminRole) {
      throw new Error('El rol admin debe existir antes del bootstrap');
    }

    let existing: UserEntity | null = null;
    try {
      existing = await usersService.findByEmail(admin.email);
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
    }

    if (existing) {
      if (existing.role?.id !== adminRole.id) {
        throw new Error(
          'El usuario configurado para bootstrap existe sin rol admin',
        );
      }
      console.log('Administrador inicial ya existente; bootstrap omitido');
      return;
    }

    await usersService.create({
      name: admin.name,
      email: admin.email,
      password: admin.password,
      phone: admin.phone,
      roleId: adminRole.id,
    });
    console.log('Administrador inicial creado correctamente');
  } finally {
    if (createdContext) await app.close();
  }
}
