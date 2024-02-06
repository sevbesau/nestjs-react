import { TAddress } from '@common/schemas';
import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

export const addressFactory = Factory.define<TAddress>(() => ({
  street: `${faker.location.street()} ${faker.location.buildingNumber()}`,
  zip: faker.location.zipCode('####'),
  city: faker.location.city(),
}));
