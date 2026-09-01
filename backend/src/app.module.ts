import { join } from 'node:path'
import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ServeStaticModule } from '@nestjs/serve-static'
import { AppController } from '@/app.controller'
import { PrismaModule } from '@/database/prisma.module'
import { AuctionModule } from '@/modules/auction/auction.module'
import { AuthModule } from '@/modules/auth/auth.module'
import { AvatarModule } from '@/modules/avatar/avatar.module'
import { ImgModule } from '@/modules/img/img.module'
import { CustomJwtModule } from '@/modules/jwt/jwt.module'
import { KickModule } from '@/modules/kick/kick.module'
import { LikeModule } from '@/modules/like/like.module'
import { LimitModule } from '@/modules/limit/limit.module'
import { QueueModule } from '@/modules/queue/queue.module'
import { RateLimitGuard } from '@/modules/rate-limit/rate-limit.guard'
import { RateLimitModule } from '@/modules/rate-limit/rate-limit.module'
import { RecordModule } from '@/modules/record/record.module'
import { RecordsProvidersModule } from '@/modules/records-providers/records-providers.module'
import { SteamModule } from '@/modules/steam/steam.module'
import { SuggestionModule } from '@/modules/suggestion/suggestion.module'
import { TwirModule } from '@/modules/twir/twir.module'
import { TwitchModule } from '@/modules/twitch/twitch.module'
import { UserModule } from '@/modules/user/user.module'
import { WeatherModule } from '@/modules/weather/weather.module'
import { WebsocketModule } from '@/modules/websocket/websocket.module'

@Module({
  controllers: [AppController],
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
    }),
    EventEmitterModule.forRoot(),
    RateLimitModule,
    AuctionModule,
    TwirModule,
    TwitchModule,
    KickModule,
    CustomJwtModule,
    AuthModule,
    AvatarModule,
    RecordModule,
    UserModule,
    PrismaModule,
    CustomJwtModule,
    LimitModule,
    LikeModule,
    QueueModule,
    SuggestionModule,
    WeatherModule,
    RecordsProvidersModule,
    SteamModule,
    // SpotifyModule,
    WebsocketModule,
    ImgModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
