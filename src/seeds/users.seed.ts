import { NestFactory } from "@nestjs/core";
import { AppModule } from "src/app.module";
import { RolesService } from "src/modules/roles/roles.service";
import { UsersService } from "src/modules/users/users.service";

type SeedUser = {
    name: string;
    email: string;
    password: string;
    phone: number;
    roleName: string;
}

export async function seedUsers(app?: any) {
    let createdContext = false;

    if (!app) {
        app = await NestFactory.createApplicationContext(AppModule);
        createdContext = true;
    }

    const rolesService: RolesService = app.get(RolesService);
    const usersService: UsersService = app.get(UsersService);

    const users: SeedUser[] = [
        { name: 'Admin Sistema', email: 'grovergonzalez8@gmail.com', password: 'Admin123*', phone: 64858084, roleName: 'admin' },
        { name: 'Cocinero 1', email: 'kitchen@restaurant.test', password: 'Kitchen123*', phone: 64858085, roleName: 'kitchen' },
        { name: 'Mesero 1', email: 'waiter@restaurant.test', password: 'Waiter123*', phone: 64858086, roleName: 'waiter' },
    ];

    for (const userData of users) {
        try {
            const existing = await usersService.findByEmail?.(userData.email);
            if (existing) {
                console.log(`Usuario existente, skip: ${userData.email}`);
                continue;
            }
            
            let role = await rolesService.findByName(userData.roleName);

            if (!role) {
                try {
                    const created = await rolesService.create({ name: userData.roleName, description: `${userData.roleName} seed`});
                    role = created;
                    console.log(`Rol '${userData.roleName}' creado exitosamente para el usuario '${userData.email}'.`);
                } catch (error) {
                    console.error(`Error al crear el rol '${userData.roleName}' para el usuario '${userData.email}':`, error.message);
                    role = await rolesService.findByName ? await rolesService.findByName(userData.roleName) : null;
                }
            }

            const dto: any = {
                name: userData.name,
                email: userData.email,
                password: userData.password,
                phone: userData.phone,
                roleId: role?.id,
            };

            await usersService.create(dto);
            console.log(`Usuario '${userData.name}' creado exitosamente.`); 
        } catch (error) {
            console.error(`Error al crear el usuario '${userData.name}':`, error.message);
        }
    }
    if (createdContext) {
      await app.close();  
    } 
}

seedUsers().catch(error => {
    console.error('Error al ejecutar el seed de usuarios:', error);
    process.exit(1);
});