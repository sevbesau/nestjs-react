import { TConfig } from '@lib/config/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<TConfig>) => ({
        uri: configService.getOrThrow('DATABASE_URI'),
        dbName: configService.getOrThrow('DATABASE_NAME'),
      }),
    }),
  ],
})
export class DataBaseModule {}
