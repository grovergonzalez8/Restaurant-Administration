import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1785859200000 implements MigrationInterface {
  name = 'InitialSchema1785859200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(
      `CREATE TYPE "Tables_status_enum" AS ENUM ('FREE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "MenuItems_status_enum" AS ENUM ('AVAIBLE', 'OUT_OF_STOCK', 'DISABLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "orders_status_enum" AS ENUM ('PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "kitchenOrders_status_enum" AS ENUM ('pending', 'in_progress', 'ready', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "reservations_status_enum" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "cashSessions_status_enum" AS ENUM ('OPEN', 'CLOSED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "payments_method_enum" AS ENUM ('CASH', 'CARD', 'QR')`,
    );

    await queryRunner.query(
      `CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "UQ_roles_name" UNIQUE ("name"), CONSTRAINT "PK_roles" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Tables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "number" integer NOT NULL, "capacity" integer NOT NULL DEFAULT 4, "status" "Tables_status_enum" NOT NULL DEFAULT 'FREE', CONSTRAINT "UQ_tables_number" UNIQUE ("number"), CONSTRAINT "PK_tables" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "MenuItems" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "imageUrl" character varying, "model3dUrl" character varying, "iosModel3dUrl" character varying, "price" numeric(10,2) NOT NULL, "status" "MenuItems_status_enum" NOT NULL DEFAULT 'AVAIBLE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_menu_items" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inventoryItem" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "quantity" numeric(10,2) NOT NULL DEFAULT 0, "minStock" numeric(10,2) NOT NULL DEFAULT 5, "unit" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_inventory_item" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "phone" character varying, "isActive" boolean NOT NULL DEFAULT true, "sessionVersion" integer NOT NULL DEFAULT 0, "roleId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_users_email" UNIQUE ("email"), CONSTRAINT "PK_users" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tableId" uuid NOT NULL, "createdById" uuid, "status" "orders_status_enum" NOT NULL DEFAULT 'PENDING', "total" numeric(10,2) NOT NULL DEFAULT 0, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_orders" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "OrderItems" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "menuItemId" uuid NOT NULL, "quantity" integer NOT NULL, "unitPrice" numeric(10,2) NOT NULL, "subtotal" numeric(10,2) NOT NULL, CONSTRAINT "PK_order_items" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "kitchenOrders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "status" "kitchenOrders_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_kitchen_orders" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inventoryEntries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "itemId" uuid NOT NULL, "quantity" numeric(10,2) NOT NULL, "note" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_inventory_entries" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inventoryOutputs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "itemId" uuid NOT NULL, "quantity" numeric(10,2) NOT NULL, "note" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_inventory_outputs" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "recipeItems" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "menuItemId" uuid NOT NULL, "inventoryItemId" uuid NOT NULL, "quantity" numeric(10,2) NOT NULL, CONSTRAINT "UQ_04845a2b5c711f0d6e07ec3ff4f" UNIQUE ("menuItemId", "inventoryItemId"), CONSTRAINT "PK_recipe_items" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "reservations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tableId" uuid NOT NULL, "customerName" character varying NOT NULL, "phone" character varying NOT NULL, "email" character varying, "guests" integer NOT NULL, "reservationAt" TIMESTAMP NOT NULL, "status" "reservations_status_enum" NOT NULL DEFAULT 'PENDING', "note" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_reservations" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "cashSessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "openedById" uuid NOT NULL, "openingBalance" numeric(10,2) NOT NULL, "expectedBalance" numeric(10,2), "closingBalance" numeric(10,2), "difference" numeric(10,2), "status" "cashSessions_status_enum" NOT NULL DEFAULT 'OPEN', "openedAt" TIMESTAMP NOT NULL DEFAULT now(), "closedAt" TIMESTAMP, CONSTRAINT "PK_cash_sessions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "createdById" uuid, "cashSessionId" uuid, "amount" numeric(10,2) NOT NULL, "receivedAmount" numeric(10,2), "changeAmount" numeric(10,2), "method" "payments_method_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_payments" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_368e146b785b574f42ae9e53d5e" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_2a7fdd7af437285a3ef0fc8b64f" FOREIGN KEY ("tableId") REFERENCES "Tables"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_39b1402eea81b07616277578fa5" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "OrderItems" ADD CONSTRAINT "FK_f91820d35e8129e7dd09881d886" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "OrderItems" ADD CONSTRAINT "FK_848588d1f1f834cf6691365734a" FOREIGN KEY ("menuItemId") REFERENCES "MenuItems"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "kitchenOrders" ADD CONSTRAINT "FK_13f7131982e0957329ce35e6b12" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventoryEntries" ADD CONSTRAINT "FK_6f4c78a6dd8796b6d0eac07c785" FOREIGN KEY ("itemId") REFERENCES "inventoryItem"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventoryOutputs" ADD CONSTRAINT "FK_7a5895672d22f9a72ddc4cfa71d" FOREIGN KEY ("itemId") REFERENCES "inventoryItem"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipeItems" ADD CONSTRAINT "FK_2f2d82050c8ed0329ccce8a1ed7" FOREIGN KEY ("menuItemId") REFERENCES "MenuItems"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipeItems" ADD CONSTRAINT "FK_ba6b317b63e7e3765fc9620c746" FOREIGN KEY ("inventoryItemId") REFERENCES "inventoryItem"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservations" ADD CONSTRAINT "FK_42ee40914a466cb26141c81e878" FOREIGN KEY ("tableId") REFERENCES "Tables"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cashSessions" ADD CONSTRAINT "FK_3e42b96d9418268d8dff48a52fa" FOREIGN KEY ("openedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_af929a5f2a400fdb6913b4967e1" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_8b8ddc119cf77e4a8968f47a703" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_1661f82d8d5797f1351e04838e9" FOREIGN KEY ("cashSessionId") REFERENCES "cashSessions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "cashSessions"`);
    await queryRunner.query(`DROP TABLE "reservations"`);
    await queryRunner.query(`DROP TABLE "recipeItems"`);
    await queryRunner.query(`DROP TABLE "inventoryOutputs"`);
    await queryRunner.query(`DROP TABLE "inventoryEntries"`);
    await queryRunner.query(`DROP TABLE "kitchenOrders"`);
    await queryRunner.query(`DROP TABLE "OrderItems"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "inventoryItem"`);
    await queryRunner.query(`DROP TABLE "MenuItems"`);
    await queryRunner.query(`DROP TABLE "Tables"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TYPE "payments_method_enum"`);
    await queryRunner.query(`DROP TYPE "cashSessions_status_enum"`);
    await queryRunner.query(`DROP TYPE "reservations_status_enum"`);
    await queryRunner.query(`DROP TYPE "kitchenOrders_status_enum"`);
    await queryRunner.query(`DROP TYPE "orders_status_enum"`);
    await queryRunner.query(`DROP TYPE "MenuItems_status_enum"`);
    await queryRunner.query(`DROP TYPE "Tables_status_enum"`);
  }
}
