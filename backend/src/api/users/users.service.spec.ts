import { UserRole } from '@common/schemas';
import { faker } from '@faker-js/faker';
import { MyConfigModule } from '@lib/config/config.module';
import { DataBaseModule } from '@lib/database/database.module';
import { userDocFactory, userFactory } from '@lib/test/factories';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import { CreateUserDto } from './dto/user.create.dto';
import { UserNotFoundException } from './user.exceptions';
import { User, UserSchema } from './users.schema';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let module: TestingModule;
  let usersService: UsersService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MyConfigModule,
        DataBaseModule,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UsersService],
    }).compile();

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

    it('should insert a new user into the database', async () => {
      const userDto = userFactory.build();
      const result = await usersService.createOne(userDto);
      expect(result).toBeDefined();
      expect(result).toMatchObject<Model<User>>;
      const createdUser = await usersService.findById(result._id);
      expect(createdUser).toBeDefined();
    });

    it('should reject invalid input', async () => {
      const userDto: CreateUserDto = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          zip: '',
        },
      };
      await expect(
        usersService.createOne(userDto),
      ).rejects.toThrowErrorMatchingSnapshot();
    });
  });

  describe('findById', () => {
    it('should be defined', () => {
      expect(usersService.findById).toBeDefined();
    });

    it('should find a user in the database by id', async () => {
      const user = await usersService.createOne(userFactory.build());
      const foundUser = await usersService.findById(user._id);
      expect(foundUser).toBeDefined();
    });

    it('should throw when the user is not found', async () => {
      await expect(
        usersService.findById(faker.database.mongodbObjectId()),
      ).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should be defined', () => {
      expect(usersService.findByEmail).toBeDefined();
    });

    it('should find a user in the database by email', async () => {
      const user = await usersService.createOne(userFactory.build());
      const foundUser = await usersService.findByEmail(user.email);
      expect(foundUser).toBeDefined();
    });

    it('should throw when the user is not found', async () => {
      await expect(
        usersService.findById(faker.database.mongodbObjectId()),
      ).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('isDuplicateEmail', () => {
    it('should be defined', () => {
      expect(usersService.isDuplicateEmail).toBeDefined();
    });

    it('should return true if a user exists with a given email', async () => {
      const user = await usersService.createOne(userFactory.build());
      const isDuplicateEmail = await usersService.isDuplicateEmail(user.email);
      expect(isDuplicateEmail).toBe(true);
    });

    it('should return false if no user exists with a given email', async () => {
      const { email } = userFactory.build();
      const isDuplicateEmail = await usersService.isDuplicateEmail(email);
      expect(isDuplicateEmail).toBe(false);
    });
  });

  describe('addRoleById', () => {
    it('should be defined', () => {
      expect(usersService.addRoleById).toBeDefined();
    });

    it('should add a new role to the users roles', async () => {
      const user = await usersService.createOne(userFactory.build());
      const updatedUser = await usersService.addRoleById(
        user._id,
        UserRole.GOD,
      );

      expect(updatedUser.roles.length).toEqual(user.roles.length + 1);
      expect(updatedUser.roles).toEqual([...user.roles, UserRole.GOD]);
    });

    it('should not add duplicate roles', async () => {
      const user = await usersService.createOne(userFactory.build());
      const updatedUser = await usersService.addRoleById(
        user._id,
        UserRole.RECIPIENT,
      );
      expect(updatedUser.roles).toEqual(user.roles);
    });

    it('should throw when the user is not found', async () => {
      const mockUser = userDocFactory.build();
      await expect(
        usersService.addRoleById(mockUser._id, UserRole.GOD),
      ).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('addOtpById', () => {
    const mockOtp = {
      password: 'password',
      expiresAt: Date.now(),
    };

    it('should be defined', () => {
      expect(usersService.addOtpById).toBeDefined();
    });

    it('should add an otp to a user and return the updated doc', async () => {
      const user = await usersService.createOne(userFactory.build());
      const updatedUser = await usersService.addOtpById(user._id, mockOtp);
      expect(updatedUser?.otps).toMatchObject([mockOtp]);
    });

    it('should throw when the user is not found', async () => {
      const mockUser = userDocFactory.build();
      await expect(
        usersService.addOtpById(mockUser._id, mockOtp),
      ).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('clearOtpsById', () => {
    it('should be defined', () => {
      expect(usersService.clearOtpsById).toBeDefined();
    });

    it('should remove all otps from a user and return the updated doc', async () => {
      const user = await usersService.createOne(userFactory.build());
      const mockOtp = {
        password: 'password',
        expiresAt: Date.now(),
      };
      await Promise.all([
        usersService.addOtpById(user._id, mockOtp),
        usersService.addOtpById(user._id, mockOtp),
      ]);

      const updatedUser = await usersService.clearOtpsById(user._id);

      expect(updatedUser?.otps).toMatchObject([]);
    });

    it('should throw when the user if not found', async () => {
      const mockUser = userDocFactory.build();
      await expect(usersService.clearOtpsById(mockUser._id)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('verifyById', () => {
    it('should be defined', () => {
      expect(usersService.verifyById).toBeDefined();
    });

    it('should verify the user and return the updated doc', async () => {
      const user = await usersService.createOne(userFactory.build());
      expect(user.verified).toBe(false);

      const updatedUser = await usersService.verifyById(user._id);

      expect(updatedUser._id).toEqual(user._id);
      expect(updatedUser.verified).toBe(true);
    });

    it('should throw when the user is not found', async () => {
      const mockUser = userDocFactory.build();
      await expect(usersService.verifyById(mockUser._id)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('updateById', () => {
    it('should be defined', () => {
      expect(usersService.updateById).toBeDefined();
    });

    it('should update a user and return the updated doc', async () => {
      const user = await usersService.createOne(userFactory.build());
      const newFirstName = 'other';
      const newLastName = 'name';
      const updatedUser = await usersService.updateById(user._id, {
        firstName: newFirstName,
        lastName: newLastName,
      });
      expect(updatedUser).toBeDefined();
      expect(updatedUser.firstName).toBe(newFirstName);
      expect(updatedUser.lastName).toBe(newLastName);
    });

    it('should throw when the user is not found', async () => {
      const mockUser = userDocFactory.build();
      await expect(
        usersService.updateById(mockUser._id, mockUser),
      ).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('incrementTokenVersionById', () => {
    it('should be defined', () => {
      expect(usersService.incrementTokenVersionById).toBeDefined();
    });

    it('should increment the tokenversion of a user and return the updated doc', async () => {
      const user = await usersService.createOne(userFactory.build());
      const updatedUser = await usersService.incrementTokenVersionById(
        user._id,
      );
      expect(updatedUser?.tokenVersion).toBe(user.tokenVersion + 1);
    });

    it('should throw when the user is not found', async () => {
      const mockUser = userDocFactory.build();
      await expect(
        usersService.incrementTokenVersionById(mockUser._id),
      ).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('deleteOneById', () => {
    it('should be defined', () => {
      expect(usersService.deleteOneById).toBeDefined();
    });

    it('should increment the tokenversion of a user and return the updated doc', async () => {
      const user = await usersService.createOne(userFactory.build());
      const deletedUser = await usersService.deleteOneById(user._id);
      expect(deletedUser?._id).toEqual(user._id);
      await expect(
        usersService.findById(deletedUser?._id as string),
      ).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should throw when the user is not found', async () => {
      const mockUser = userDocFactory.build();
      await expect(usersService.deleteOneById(mockUser._id)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });
});
