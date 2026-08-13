import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInventoryMovementActor1786665600000 implements MigrationInterface {
  name = 'AddInventoryMovementActor1786665600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventoryEntries" ADD "performedById" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventoryOutputs" ADD "performedById" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventoryEntries" ADD CONSTRAINT "FK_inventory_entries_performed_by" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventoryOutputs" ADD CONSTRAINT "FK_inventory_outputs_performed_by" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventoryOutputs" DROP CONSTRAINT "FK_inventory_outputs_performed_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventoryEntries" DROP CONSTRAINT "FK_inventory_entries_performed_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventoryOutputs" DROP COLUMN "performedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventoryEntries" DROP COLUMN "performedById"`,
    );
  }
}
