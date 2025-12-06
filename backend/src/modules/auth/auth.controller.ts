import { env } from "@/utils/enviroments"
import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common"
import { ApiResponse } from "@nestjs/swagger"
import { TwitchService } from "../twitch/twitch.service"
import { UserEntity } from "../user/user.entity"
import { UserService } from "../user/user.service"
import { AuthGuard } from "./auth.guard"
import { AuthService } from "./auth.service"
import { User } from "./auth.user.decorator"
import { CallbackDto } from "./dto/callback.dto"
import type { Response } from "express"

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly userService: UserService, private readonly twitch: TwitchService) {}

  @Get("/twitch")
  twitchAuth(@Res() res: Response) {
    const redirectUri = "https://id.twitch.tv/oauth2/authorize?"
      + `client_id=${env.TWITCH_CLIENT_ID}&`
      + `redirect_uri=${env.TWITCH_CALLBACK_URL}&`
      + "response_type=code&"
      + "scope=user:read:email"
    res.redirect(redirectUri)
  }

  @Post("/twitch/callback")
  async twitchAuthCallback(@Body() data: CallbackDto, @Res() res: Response) {
    const token = await this.authService.handleCallback(data.code)
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })

    res.status(200).send("Authentication successful")
  }

  @Get("/me")
  @UseGuards(AuthGuard)
  @ApiResponse({ type: UserEntity, status: 200 })
  me(@User() user: UserEntity) {
    return user
  }

  @Post("/logout")
  logout(@Res() res: Response) {
    res.clearCookie("token")
    res.end()
  }
}
