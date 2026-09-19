import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { UserModule } from '@/modules/user/user.module'
import { DrizzleWordleRepository } from '@/modules/wordle/repositories/drizzle-wordle.repository'
import { WordleController } from '@/modules/wordle/wordle.controller'
import { WordleDictionary } from '@/modules/wordle/wordle.dictionary'
import { WordleService } from '@/modules/wordle/wordle.service'

@Module({
  imports: [DrizzleModule, UserModule],
  controllers: [WordleController],
  providers: [WordleService, DrizzleWordleRepository, WordleDictionary],
})
export class WordleModule {}
