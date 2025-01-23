import { join } from 'node:path'
import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { PrismaModule } from './database/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { GameModule } from './modules/game/game.module'
import { PersonModule } from './modules/person/person.module'
import { UserModule } from './modules/user/user.module'
import { VideoModule } from './modules/video/video.module'

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
    }),
    AuthModule,
    PersonModule,
    VideoModule,
    GameModule,
    UserModule,
    PrismaModule,
  ],
})
export class AppModule {}
