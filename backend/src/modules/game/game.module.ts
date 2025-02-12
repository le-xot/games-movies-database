import { Module } from '@nestjs/common'
import { PrismaModule } from '../../database/prisma.module'
import { UserModule } from '../user/user.module'
import { GameController } from './game.controller'
import { GameService } from './game.service'

@Module({
  imports: [PrismaModule, UserModule],
  providers: [GameService],
  controllers: [GameController],
})
export class GameModule {}
