import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderItemCostSnapshot1786838400000 implements MigrationInterface {
  name = 'AddOrderItemCostSnapshot1786838400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "OrderItems" ADD "unitCost" numeric(12,4) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "OrderItems" ADD "costTracked" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "OrderItems" DROP COLUMN "costTracked"`,
    );
    await queryRunner.query(`ALTER TABLE "OrderItems" DROP COLUMN "unitCost"`);
  }
}
