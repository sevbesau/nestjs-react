import { createUserSchema, TOtp, UserRole } from '@common/schemas';
import { BaseRepository } from '@lib/database/repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UpdateUserDto } from './dto/user.update.dto';
import { User } from './users.schema';

@Injectable()
export class UsersRepository extends BaseRepository<
  User,
  typeof createUserSchema
> {
  constructor(@InjectModel(User.name) userModel: Model<User>) {
    super(userModel, createUserSchema);
  }

  async findOneByEmailOrFail(email: string) {
    return this.findOneByConditionOrFail({ email });
  }

  async addRoleByIdOrFail(userId: string, role: UserRole) {
    return this.updateOneByIdOrFail(userId, { $addToSet: { roles: role } });
  }

  async addOtpByIdOrFail(userId: string, otp: TOtp): Promise<User> {
    return this.updateOneByIdOrFail(userId, { $push: { otps: otp } });
  }

  async clearOtpsByIdOrFail(userId: string): Promise<User> {
    return this.updateOneByIdOrFail(userId, { $set: { otps: [] } });
  }

  async verifyByIdOrFail(userId: string): Promise<User> {
    return this.updateOneByIdOrFail(userId, { $set: { verified: true } });
  }

  async incrementTokenVersionByIdOrFail(userId: string): Promise<User> {
    return this.updateOneByIdOrFail(userId, { $inc: { tokenVersion: 1 } });
  }

  async overwriteOneByIdOrFail(userId: string, updateUserDto: UpdateUserDto) {
    return this.updateOneByIdOrFail(userId, { $set: updateUserDto });
  }
}
