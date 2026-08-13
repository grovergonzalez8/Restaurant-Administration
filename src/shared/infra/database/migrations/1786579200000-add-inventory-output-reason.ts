import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInventoryOutputReason1786579200000 implements MigrationInterface {
  name = 'AddInventoryOutputReason1786579200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventoryOutputs" ADD "reason" character varying(20) NOT NULL DEFAULT 'consumption'`,
    );
    await queryRunner.query(
      `UPDATE "inventoryOutputs" SET "reason" = CASE WHEN "note" = 'Ajuste manual de inventario' THEN 'adjustment' ELSE 'consumption' END`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventoryOutputs" ADD CONSTRAINT "CHK_inventory_output_reason" CHECK ("reason" IN ('consumption', 'waste', 'adjustment'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventoryOutputs" DROP CONSTRAINT "CHK_inventory_output_reason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventoryOutputs" DROP COLUMN "reason"`,
    );
  }
}
