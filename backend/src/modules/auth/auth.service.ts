import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '../user/user.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userServices: UserService,
  ) {}

  async signJwt(userId: string): Promise<string> {
    const foundedUser = await this.userServices.getUserById(userId)
    if (!foundedUser) {
      throw new HttpException(
        'User does not exist',
        HttpStatus.UNAUTHORIZED,
      )
    }

    const payload = { id: foundedUser.id }

    return await this.jwtService.signAsync(payload)
  }
}
