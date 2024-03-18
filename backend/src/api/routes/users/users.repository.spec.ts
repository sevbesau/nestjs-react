/* eslint-disable @typescript-eslint/ban-ts-comment */
import { TOtp, UserRole } from '@eacend/schemas';
import { faker } from '@faker-js/faker';
import { model } from 'mongoose';

import { UsersRepository } from './users.repository';
import { User, UserSchema } from './users.schema';

const userModel = model<User>('User', UserSchema);
const usersRepository = new UsersRepository(userModel);

describe('UsersRepository', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 22, 2));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('Should be defined', () => {
    expect(UsersRepository).toBeDefined();
  });

  describe('findOneByEmailOrFail', () => {
    it('Should be defined', () => {
      expect(usersRepository.findOneByEmailOrFail).toBeDefined();
    });

    it('should call the baseRepository findOneByConditionOrFail and return the promise', async () => {
      const email = faker.internet.email();
      const resolveValue = { foo: 'bar' };
      usersRepository['findOneByConditionOrFail'] = jest
        .fn()
        .mockResolvedValue(resolveValue);

      const result = await usersRepository.findOneByEmailOrFail(email);

      expect(result).toEqual(resolveValue);
      expect(usersRepository['findOneByConditionOrFail']).toBeCalledWith({
        email,
      });
    });
  });

  describe('addRoleByIdOrFail', () => {
    it('Should be defined', () => {
      expect(usersRepository.addRoleByIdOrFail).toBeDefined();
    });

    it('should call the baseRepository updateOneByIdOrFail and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const role = faker.helpers.enumValue(UserRole);
      const resolveValue = { foo: 'bar', roles: [role] };
      usersRepository['updateOneByIdOrFail'] = jest
        .fn()
        .mockResolvedValue(resolveValue);

      const result = await usersRepository.addRoleByIdOrFail(userId, role);

      expect(result).toEqual(resolveValue);
      expect(usersRepository['updateOneByIdOrFail']).toBeCalledWith(userId, {
        $addToSet: { roles: role },
      });
    });
  });

  describe('addOtpByIdOrFail', () => {
    it('Should be defined', () => {
      expect(usersRepository.addOtpByIdOrFail).toBeDefined();
    });

    it('should call the baseRepository updateOneByIdOrFail and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const otp: TOtp = {
        password: faker.number.int({ min: 100000, max: 999999 }).toString(),
        expiresAt: Date.now(),
      };
      const resolveValue = { foo: 'bar', otps: [otp] };
      usersRepository['updateOneByIdOrFail'] = jest
        .fn()
        .mockResolvedValue(resolveValue);

      const result = await usersRepository.addOtpByIdOrFail(userId, otp);

      expect(result).toEqual(resolveValue);
      expect(usersRepository['updateOneByIdOrFail']).toBeCalledWith(userId, {
        $push: { otps: otp },
      });
    });
  });

  describe('clearOtpsByIdOrFail', () => {
    it('Should be defined', () => {
      expect(usersRepository.clearOtpsByIdOrFail).toBeDefined();
    });

    it('should call the baseRepository updateOneByIdOrFail and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const resolveValue = { foo: 'bar' };
      usersRepository['updateOneByIdOrFail'] = jest
        .fn()
        .mockResolvedValue(resolveValue);

      const result = await usersRepository.clearOtpsByIdOrFail(userId);

      expect(result).toEqual(resolveValue);
      expect(usersRepository['updateOneByIdOrFail']).toBeCalledWith(userId, {
        $set: { otps: [] },
      });
    });
  });

  describe('verifyByIdOrFail', () => {
    it('Should be defined', () => {
      expect(usersRepository.verifyByIdOrFail).toBeDefined();
    });

    it('should call the baseRepository updateOneByIdOrFail and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const resolveValue = { foo: 'bar' };
      usersRepository['updateOneByIdOrFail'] = jest
        .fn()
        .mockResolvedValue(resolveValue);

      const result = await usersRepository.verifyByIdOrFail(userId);

      expect(result).toEqual(resolveValue);
      expect(usersRepository['updateOneByIdOrFail']).toBeCalledWith(userId, {
        $set: { verified: true },
      });
    });
  });

  describe('incrementTokenVersionByIdOrFail', () => {
    it('Should be defined', () => {
      expect(usersRepository.incrementTokenVersionByIdOrFail).toBeDefined();
    });

    it('should call the baseRepository updateOneByIdOrFail and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const resolveValue = { foo: 'bar' };
      usersRepository['updateOneByIdOrFail'] = jest
        .fn()
        .mockResolvedValue(resolveValue);

      const result = await usersRepository.incrementTokenVersionByIdOrFail(
        userId,
      );

      expect(result).toEqual(resolveValue);
      expect(usersRepository['updateOneByIdOrFail']).toBeCalledWith(userId, {
        $inc: { tokenVersion: 1 },
      });
    });
  });

  describe('overwriteOneByIdOrFail', () => {
    it('Should be defined', () => {
      expect(usersRepository.overwriteOneByIdOrFail).toBeDefined();
    });

    it('should call the baseRepository updateOneByIdOrFail and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const update = { foo: 'baz' };
      const resolveValue = { ...update };
      usersRepository['updateOneByIdOrFail'] = jest
        .fn()
        .mockResolvedValue(resolveValue);

      const result = await usersRepository.overwriteOneByIdOrFail(
        userId,
        // @ts-ignore
        update,
      );

      expect(result).toEqual(resolveValue);
      expect(usersRepository['updateOneByIdOrFail']).toBeCalledWith(userId, {
        $set: update,
      });
    });
  });

  describe('setDeleteRequestedByIdOrFail', () => {
    it('Should be defined', () => {
      expect(usersRepository.setDeleteRequestedByIdOrFail).toBeDefined();
    });

    it('should call the baseRepository updateOneByIdOrFail and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const resolveValue = { foo: 'baz' };
      usersRepository['updateOneByIdOrFail'] = jest
        .fn()
        .mockResolvedValue(resolveValue);

      const result = await usersRepository.setDeleteRequestedByIdOrFail(userId);

      expect(result).toEqual(resolveValue);
      expect(usersRepository['updateOneByIdOrFail']).toBeCalledWith(userId, {
        $set: { deleteRequested: new Date() },
      });
    });
  });

  describe('setDeleteByInOneMonthByIdOrFail', () => {
    it('Should be defined', () => {
      expect(usersRepository.setDeleteByInOneMonthByIdOrFail).toBeDefined();
    });

    it('should call the baseRepository updateOneByIdOrFail and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const now = new Date();
      const inOneMonth = new Date(now.setMonth(now.getMonth() + 1));
      const resolveValue = { foo: 'baz', deleteBy: inOneMonth };
      usersRepository['updateOneByIdOrFail'] = jest
        .fn()
        .mockResolvedValue(resolveValue);

      const result = await usersRepository.setDeleteByInOneMonthByIdOrFail(
        userId,
      );

      expect(result).toEqual(resolveValue);
      expect(usersRepository['updateOneByIdOrFail']).toBeCalledWith(userId, {
        $set: { deleteBy: inOneMonth },
      });
    });
  });
});
