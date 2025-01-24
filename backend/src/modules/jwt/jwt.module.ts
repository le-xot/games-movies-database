import { Global, Module } from '@nestjs/common'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { env } from '../../utils/enviroments'

const RegisteredJwtModule = JwtModule.register({
  secret: env.JWT_SECRET,
  signOptions: { expiresIn: '30d' },
})

@Global()
@Module({
  imports: [RegisteredJwtModule],
  providers: [JwtService],
  exports: [RegisteredJwtModule],
})
export class CustomJwtModule {}
