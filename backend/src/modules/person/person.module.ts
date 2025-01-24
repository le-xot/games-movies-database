import { Module } from '@nestjs/common'
import { PrismaModule } from '../../database/prisma.module'
import { UserModule } from '../user/user.module'
import { PersonController } from './person.controller'
import { PersonService } from './person.service'

@Module({
  imports: [PrismaModule, UserModule],
  providers: [PersonService],
  controllers: [PersonController],
})
export class PersonModule {}
