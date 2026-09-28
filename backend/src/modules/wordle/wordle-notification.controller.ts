import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { User } from '@/modules/auth/auth.user.decorator'
import { RateLimit } from '@/modules/rate-limit/rate-limit.decorator'
import { UserEntity } from '@/modules/user/user.entity'
import {
  WordleNotificationsDeleteDTO,
  WordleNotificationsLinkDTO,
  WordleNotificationsStatusDTO,
  WordleNotificationsUpdateDTO,
} from '@/modules/wordle/wordle-notification.dto'
import { WordleNotificationService } from '@/modules/wordle/wordle-notification.service'
import { ApiErrors } from '@/utils/api-errors'
import { RATE_LIMITS } from '@/utils/rate-limits'

@ApiTags('wordle')
@ApiErrors()
@Controller('wordle/notifications')
@UseGuards(AuthGuard, new RolesGuard([UserRole.USER, UserRole.ADMIN]))
export class WordleNotificationController {
  constructor(private readonly notifications: WordleNotificationService) {}

  @Get()
  @ApiResponse({ status: 200, type: WordleNotificationsStatusDTO })
  getStatus(@User() user: UserEntity): Promise<WordleNotificationsStatusDTO> {
    return this.notifications.getStatus(user.id)
  }

  @Post('link')
  @RateLimit(RATE_LIMITS.write)
  @ApiResponse({ status: 201, type: WordleNotificationsLinkDTO })
  createLink(@User() user: UserEntity): Promise<WordleNotificationsLinkDTO> {
    return this.notifications.createLink(user.id)
  }

  @Patch()
  @ApiResponse({ status: 200, type: WordleNotificationsStatusDTO })
  update(
    @User() user: UserEntity,
    @Body() body: WordleNotificationsUpdateDTO,
  ): Promise<WordleNotificationsStatusDTO> {
    return this.notifications.updateFlags(user.id, body)
  }

  @Delete()
  @ApiResponse({ status: 200, type: WordleNotificationsDeleteDTO })
  async remove(@User() user: UserEntity): Promise<WordleNotificationsDeleteDTO> {
    await this.notifications.disconnect(user.id)
    return { ok: true }
  }
}
