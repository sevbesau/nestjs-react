import { faker } from '@faker-js/faker';
import { BaseSchema } from '@lib/common/base.schema';
import { Factory } from 'fishery';

export { addressFactory } from './address.factory';
export { sessionFactory } from './session.factory';
export { userDocFactory, userFactory } from './user.factory';

export const baseDocFactory = Factory.define<BaseSchema>(() => ({
  _id: faker.database.mongodbObjectId(),
  createdAt: new Date(),
  updatedAt: new Date(),
}));
