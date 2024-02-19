import { Module } from '@nestjs/common';

import { ApiController } from './api.controller';
import { AuthModule } from './routes/auth/auth.module';
import { ContactModule } from './routes/contact/contact.module';
import { UsersModule } from './routes/users/users.module';

@Module({
  imports: [UsersModule, AuthModule, ContactModule],
  controllers: [ApiController],
})
export class ApiModule {}
