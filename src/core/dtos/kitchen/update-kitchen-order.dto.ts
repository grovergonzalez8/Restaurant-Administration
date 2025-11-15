import { IsNotEmpty, IsEnum } from "class-validator";
import { KitchenStatus } from "src/core/enums/kitchen-status.enum";

export class UpdateKitchenStatusDto {
    @IsNotEmpty()
    @IsEnum(KitchenStatus)
    status: KitchenStatus;
}