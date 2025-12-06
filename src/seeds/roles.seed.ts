import { NestFactory } from "@nestjs/core";
import { AppModule } from "src/app.module";
import { RolesService } from "src/modules/roles/roles.service";

export async function seedRoles(app?: any) {

    let createdContext = false;

    if (!app) {
        app = await NestFactory.createApplicationContext(AppModule);
        createdContext = true;
    }
    const rolesService: RolesService = app.get(RolesService);

    const roles = [
        { name: 'admin', description: 'Administrator del sistema' },
        { name: 'kitchen', description: 'Personal de cocina' },
        { name: 'waiter', description: 'Mesero' },
        { name: 'host', description: 'Anfitrión/Recepcionista' },
        { name: 'customer', description: 'Cliente' },
    ]
    
    for (const role of roles) {
        try {
            const existing = await rolesService.findByName?.(role.name);
            if (existing) {
                console.log(`Rol existente, skip: ${role.name}`);
                continue;
            }
            await rolesService.create(role);
            console.log(`Rol credo: ${role.name}`);
        } catch (error: any) {
            console.error(`Error al crear el rol '${role.name}':`, error.message || error);
        }
    }

    if (createdContext) {
        await app.close();
    }
}

seedRoles().catch(error => {
    console.error('Error al ejecutar el seed de roles:', error);
    process.exit(1);
});