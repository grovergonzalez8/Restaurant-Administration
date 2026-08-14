import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInventoryUnitCost1786752000000 implements MigrationInterface {
  name = 'AddInventoryUnitCost1786752000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventoryItem" ADD "unitCost" numeric(12,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventoryEntries" ADD "unitCost" numeric(12,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventoryOutputs" ADD "unitCost" numeric(12,2) NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventoryOutputs" DROP COLUMN "unitCost"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventoryEntries" DROP COLUMN "unitCost"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventoryItem" DROP COLUMN "unitCost"`,
    );
  }
}
