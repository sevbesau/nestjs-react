import { UserRole } from '@common/schemas';
import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { CreateUserDto } from '@/api/users/dto/user.create.dto';
import { User } from '@/api/users/users.schema';

import { baseDocFactory } from '.';
import { addressFactory } from './address.factory';

export const userFactory = Factory.define<CreateUserDto>(() => ({
  address: addressFactory.build(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
}));

export const userDocFactory = Factory.define<User>(() => ({
  ...baseDocFactory.build(),
  ...userFactory.build(),
  otps: [],
  roles: [UserRole.USER],
  verified: true,
  onboarded: true,
  blocked: false,
  tokenVersion: 0,
}));
