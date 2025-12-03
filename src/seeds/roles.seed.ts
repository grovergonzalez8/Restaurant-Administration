import { NestFactory } from "@nestjs/core";
import { AppModule } from "src/app.module";
import { RolesService } from "src/modules/roles/roles.service";

async function seedRoles() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const rolesService = app.get(RolesService);

    const roles = [
        { name: 'admin', description: 'Administrator del sistema' },
        { name: 'kitchen', description: 'Personal de cocina' },
        { name: 'waiter', description: 'Mesero' },
        { name: 'host', description: 'Anfitrión/Recepcionista' },
        { name: 'customer', description: 'Cliente' },
    ]
    
    for (const role of roles) {
        try {
            await rolesService.create(role);
            console.log(`Rol '${role.name}' creado exitosamente.`);
        } catch (error) {
            console.error(`Error al crear el rol '${role.name}':`, error.message);
        }
    }
    await app.close();
}

seedRoles().catch(error => {
    console.error('Error al ejecutar el seed de roles:', error);
    process.exit(1);
});