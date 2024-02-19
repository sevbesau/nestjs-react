import { Routes } from '@nestjs/core';

import { ApiModule } from './api/api.module';
import { AuthModule } from './api/routes/auth/auth.module';
import { ContactModule } from './api/routes/contact/contact.module';
import { UsersModule } from './api/routes/users/users.module';
import { ClientModule } from './client/client.module';

export const routes: Routes = [
  {
    path: '/api',
    module: ApiModule,
    children: [
      {
        path: '/users',
        module: UsersModule,
      },
      {
        path: '/auth',
        module: AuthModule,
      },
      {
        path: '/contact',
        module: ContactModule,
      },
    ],
  },
  {
    path: '',
    module: ClientModule,
  },
];
