import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { ApiResponse, ApiTags } from "@nestjs/swagger"
import { $Enums } from "@prisma/client"
import { AuthGuard } from "../auth/auth.guard"
import { RolesGuard } from "../auth/auth.roles.guard"
import { ChangeLimitDTO, LimitEntity } from "./limit.dto"
import { LimitService } from "./limit.service"

@ApiTags("limits")
@Controller("limits")
export class LimitController {
  constructor(private limitService: LimitService) {}

  @Post()
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
  @ApiResponse({
    status: 200,
    description: "Returns updated limit",
    type: LimitEntity,
  })
  async changeLimit(@Body() limitData: ChangeLimitDTO): Promise<LimitEntity> {
    return await this.limitService.changeLimit(limitData)
  }
}
