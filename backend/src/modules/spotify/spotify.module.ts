import { Module } from '@nestjs/common';
import { PrismaModule } from '@/database/prisma.module';
import { UserModule } from '../user/user.module';
import { SpotifyQueueService } from './spotify-queue.service';
import { SpotifyController } from './spotify.controller';
import { SpotifyService } from './spotify.service';

@Module({
  imports: [PrismaModule, UserModule],
  providers: [SpotifyService, SpotifyQueueService],
  controllers: [SpotifyController],
})
export class SpotifyModule {}
