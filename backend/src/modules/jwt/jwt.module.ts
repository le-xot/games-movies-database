import { env } from "@/utils/enviroments"
import { Global, Module } from "@nestjs/common"
import { JwtModule, JwtService } from "@nestjs/jwt"

const RegisteredJwtModule = JwtModule.register({
  secret: env.JWT_SECRET,
  signOptions: { expiresIn: "30d" },
})

@Global()
@Module({
  imports: [RegisteredJwtModule],
  providers: [JwtService],
  exports: [RegisteredJwtModule],
})
export class CustomJwtModule {}
