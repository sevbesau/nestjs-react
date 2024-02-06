import { faker } from '@faker-js/faker';
import { Session } from '@lib/common/session';
import { Factory } from 'fishery';

export const sessionFactory = Factory.define<Session>(() => ({
  sub: faker.database.mongodbObjectId(),
  email: faker.internet.email(),
  version: 0,
}));
