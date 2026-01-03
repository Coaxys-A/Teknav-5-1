import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { ApiTokenService } from './api-token.service';
import { OtpService } from './otp.service';
import { BruteForceService } from './bruteforce.service';
import { DeviceService } from './device.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../redis';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [
    UsersModule,
    RedisModule,
    LoggingModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') ?? 'change_this_in_prod',
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') ?? '1d',
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    SessionService,
    ApiTokenService,
    OtpService,
    BruteForceService,
    DeviceService,
    JwtStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, ApiTokenService],
})
export class AuthModule {}
