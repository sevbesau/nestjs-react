/* eslint-disable @typescript-eslint/ban-ts-comment */
import { UserRole } from '@eacend/schemas';
import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';

import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let module: TestingModule;
  let usersService: UsersService;
  const usersRepository: Partial<UsersRepository> = {};

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [UsersService],
    })
      .useMocker((token) => {
        if (token === UsersRepository) return usersRepository;
      })
      .compile();

    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  describe('createOne', () => {
    it('should be defined', () => {
      expect(usersService.createOne).toBeDefined();
    });

    it('should call createOne on the repository and return the promise', async () => {
      const input = { foo: 'bar' };
      const returnValue = { ...input, _id: faker.database.mongodbObjectId() };
      usersRepository.createOne = jest.fn().mockResolvedValue(returnValue);

      // @ts-ignore
      const result = await usersService.createOne(input);

      expect(result).toEqual(returnValue);
      expect(usersRepository.createOne).toBeCalledWith(input);
    });
  });

  describe('findOneByEmailOrCreateOne', () => {
    it('should be defined', () => {
      expect(usersService.findOneByEmailOrCreateOne).toBeDefined();
    });

    it('should call findOneByEmail on the repository and return the promise', async () => {
      const createUserDto = { email: faker.internet.email(), foo: 'bar' };
      const returnValue = {
        ...createUserDto,
        _id: faker.database.mongodbObjectId(),
      };
      usersRepository.findOneByEmailOrFail = jest
        .fn()
        .mockResolvedValue(returnValue);
      usersRepository.createOne = jest.fn();

      const result = await usersService.findOneByEmailOrCreateOne(
        // @ts-ignore
        createUserDto,
      );

      expect(result).toEqual(returnValue);
      expect(usersRepository.findOneByEmailOrFail).toBeCalledWith(
        createUserDto.email,
      );
      expect(usersRepository.createOne).not.toBeCalled();
    });

    it('should call findOneByEmail on the repository, create one if it throws and return the promise', async () => {
      const createUserDto = { email: faker.internet.email(), foo: 'bar' };
      const returnValue = {
        ...createUserDto,
        _id: faker.database.mongodbObjectId(),
      };
      usersRepository.findOneByEmailOrFail = jest
        .fn()
        .mockResolvedValue(Promise.reject());
      usersRepository.createOne = jest.fn().mockResolvedValue(returnValue);

      const result = await usersService.findOneByEmailOrCreateOne(
        // @ts-ignore
        createUserDto,
      );

      expect(result).toEqual(returnValue);
      expect(usersRepository.findOneByEmailOrFail).toBeCalledWith(
        createUserDto.email,
      );
      expect(usersRepository.createOne).toBeCalledWith(createUserDto);
    });
  });

  describe('findById', () => {
    it('should be defined', () => {
      expect(usersService.findById).toBeDefined();
    });

    it('should call findOneByIdOrFail on the repository and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const returnValue = { foo: 'bar', _id: faker.database.mongodbObjectId() };
      usersRepository.findOneByIdOrFail = jest
        .fn()
        .mockResolvedValue(returnValue);

      const result = await usersService.findById(userId);

      expect(result).toEqual(returnValue);
      expect(usersRepository.findOneByIdOrFail).toBeCalledWith(userId);
    });
  });

  describe('findByEmail', () => {
    it('should be defined', () => {
      expect(usersService.findByEmail).toBeDefined();
    });

    it('should call findOneByEmailOrFail on the repository and return the promise', async () => {
      const email = faker.internet.email();
      const returnValue = { foo: 'bar', _id: faker.database.mongodbObjectId() };
      usersRepository.findOneByEmailOrFail = jest
        .fn()
        .mockResolvedValue(returnValue);

      const result = await usersService.findByEmail(email);

      expect(result).toEqual(returnValue);
      expect(usersRepository.findOneByEmailOrFail).toBeCalledWith(email);
    });
  });

  describe('isDuplicateEmail', () => {
    it('should be defined', () => {
      expect(usersService.isDuplicateEmail).toBeDefined();
    });

    it('should call findByEmail and return true if it resolves', async () => {
      const email = faker.internet.email();
      usersService.findByEmail = jest.fn().mockResolvedValue(Promise.resolve());

      const result = await usersService.isDuplicateEmail(email);

      expect(result).toEqual(true);
      expect(usersService.findByEmail).toBeCalledWith(email);
    });

    it('should call findByEmail and return false if it throws', async () => {
      const email = faker.internet.email();
      usersService.findByEmail = jest.fn().mockResolvedValue(Promise.reject());

      const result = await usersService.isDuplicateEmail(email);

      expect(result).toEqual(false);
      expect(usersService.findByEmail).toBeCalledWith(email);
    });
  });

  describe('addRoleById', () => {
    it('should be defined', () => {
      expect(usersService.addRoleById).toBeDefined();
    });

    it('should call addRoleByIdOrFail on the repository and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const role = faker.helpers.enumValue(UserRole);
      const returnValue = {
        foo: 'bar',
        _id: faker.database.mongodbObjectId(),
        roles: [role],
      };
      usersRepository.addRoleByIdOrFail = jest
        .fn()
        .mockResolvedValue(returnValue);

      const result = await usersService.addRoleById(userId, role);

      expect(result).toEqual(returnValue);
      expect(usersRepository.addRoleByIdOrFail).toBeCalledWith(userId, role);
    });
  });

  describe('addOtpById', () => {
    it('should be defined', () => {
      expect(usersService.addOtpById).toBeDefined();
    });

    it('should call addOtpByIdOrFail on the repository and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const otp = {
        password: faker.number.int({ min: 100000, max: 999999 }).toString(),
        expiresAt: Date.now(),
      };
      const returnValue = {
        foo: 'bar',
        _id: faker.database.mongodbObjectId(),
        otps: [otp],
      };
      usersRepository.addOtpByIdOrFail = jest
        .fn()
        .mockResolvedValue(returnValue);

      const result = await usersService.addOtpById(userId, otp);

      expect(result).toEqual(returnValue);
      expect(usersRepository.addOtpByIdOrFail).toBeCalledWith(userId, otp);
    });
  });

  describe('clearOtpsById', () => {
    it('should be defined', () => {
      expect(usersService.clearOtpsById).toBeDefined();
    });

    it('should call clearOtpsByIdOrFail on the repository and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const returnValue = {
        foo: 'bar',
        _id: faker.database.mongodbObjectId(),
        otps: [],
      };
      usersRepository.clearOtpsByIdOrFail = jest
        .fn()
        .mockResolvedValue(returnValue);

      const result = await usersService.clearOtpsById(userId);

      expect(result).toEqual(returnValue);
      expect(usersRepository.clearOtpsByIdOrFail).toBeCalledWith(userId);
    });
  });

  describe('verifyById', () => {
    it('should be defined', () => {
      expect(usersService.verifyById).toBeDefined();
    });

    it('should call verifyByIdOrFail on the repository and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const returnValue = {
        foo: 'bar',
        _id: faker.database.mongodbObjectId(),
        verified: true,
      };
      usersRepository.verifyByIdOrFail = jest
        .fn()
        .mockResolvedValue(returnValue);

      const result = await usersService.verifyById(userId);

      expect(result).toEqual(returnValue);
      expect(usersRepository.verifyByIdOrFail).toBeCalledWith(userId);
    });
  });

  describe('incrementTokenVersionById', () => {
    it('should be defined', () => {
      expect(usersService.incrementTokenVersionById).toBeDefined();
    });

    it('should call incrementTokenVersionByIdOrFail on the repository and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const returnValue = {
        foo: 'bar',
        _id: faker.database.mongodbObjectId(),
        tokenVersion: 2,
      };
      usersRepository.incrementTokenVersionByIdOrFail = jest
        .fn()
        .mockResolvedValue(returnValue);

      const result = await usersService.incrementTokenVersionById(userId);

      expect(result).toEqual(returnValue);
      expect(usersRepository.incrementTokenVersionByIdOrFail).toBeCalledWith(
        userId,
      );
    });
  });

  describe('setDeleteByInOneMonthById', () => {
    it('should be defined', () => {
      expect(usersService.setDeleteByInOneMonthById).toBeDefined();
    });

    it('should call setDeleteByInOneMonthByIdOrFail on the repository and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const returnValue = {
        foo: 'bar',
        _id: faker.database.mongodbObjectId(),
        deleteBy: new Date(),
      };
      usersRepository.setDeleteByInOneMonthByIdOrFail = jest
        .fn()
        .mockResolvedValue(returnValue);

      const result = await usersService.setDeleteByInOneMonthById(userId);

      expect(result).toEqual(returnValue);
      expect(usersRepository.setDeleteByInOneMonthByIdOrFail).toBeCalledWith(
        userId,
      );
    });
  });

  describe('setDeleteRequestedById', () => {
    it('should be defined', () => {
      expect(usersService.setDeleteRequestedById).toBeDefined();
    });

    it('should call setDeleteRequestedByIdOrFail on the repository and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const returnValue = {
        foo: 'bar',
        _id: faker.database.mongodbObjectId(),
        deleteRequested: new Date(),
      };
      usersRepository.setDeleteRequestedByIdOrFail = jest
        .fn()
        .mockResolvedValue(returnValue);

      const result = await usersService.setDeleteRequestedById(userId);

      expect(result).toEqual(returnValue);
      expect(usersRepository.setDeleteRequestedByIdOrFail).toBeCalledWith(
        userId,
      );
    });
  });

  describe('updateById', () => {
    it('should be defined', () => {
      expect(usersService.updateById).toBeDefined();
    });

    it('should call overwriteOneByIdOrFail on the repository and return the promise', async () => {
      const userId = faker.database.mongodbObjectId();
      const updateUserDto = { foo: 'bar' };
      const returnValue = {
        ...updateUserDto,
        _id: userId,
      };
      usersRepository.overwriteOneByIdOrFail = jest
        .fn()
        .mockResolvedValue(returnValue);

      // @ts-ignore
      const result = await usersService.updateById(userId, updateUserDto);

      expect(result).toEqual(returnValue);
      expect(usersRepository.overwriteOneByIdOrFail).toBeCalledWith(
        userId,
        updateUserDto,
      );
    });
  });
});
