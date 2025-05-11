import { join } from 'node:path'
import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { PrismaModule } from './database/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { CustomJwtModule } from './modules/jwt/jwt.module'
import { LimitModule } from './modules/limit/limit.module'
import { QueueModule } from './modules/queue/queue.module'
import { RecordModule } from './modules/record/record.module'
import { SuggestionModule } from './modules/suggestion/suggestion.module'
import { TwitchModule } from './modules/twitch/twitch.module'
import { UserModule } from './modules/user/user.module'
import { WeatherModule } from './modules/weather/weather.module'

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
    }),
    TwitchModule,
    CustomJwtModule,
    AuthModule,
    RecordModule,
    UserModule,
    PrismaModule,
    CustomJwtModule,
    LimitModule,
    QueueModule,
    SuggestionModule,
    WeatherModule,
  ],
})
export class AppModule {}
