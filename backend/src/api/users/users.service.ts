import { TOtp, UserRole } from '@common/schemas';
import { Injectable } from '@nestjs/common';

import { CreateUserDto } from './dto/user.create.dto';
import { UpdateUserDto } from './dto/user.update.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createOne(createUserDto: CreateUserDto) {
    return this.usersRepository.createOne(createUserDto);
  }

  async findOneByEmailOrCreateOne(createUserDto: CreateUserDto) {
    try {
      return await this.usersRepository.findOneByEmailOrFail(
        createUserDto.email,
      );
    } catch (error) {
      return this.usersRepository.createOne(createUserDto);
    }
  }

  async findById(userId: string) {
    return this.usersRepository.findOneByIdOrFail(userId);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOneByEmailOrFail(email);
  }

  async isDuplicateEmail(email: string): Promise<boolean> {
    try {
      await this.findByEmail(email);
      return true;
    } catch {
      return false;
    }
  }

  async addRoleById(userId: string, role: UserRole) {
    return this.usersRepository.addRoleByIdOrFail(userId, role);
  }

  async addOtpById(userId: string, otp: TOtp) {
    return this.usersRepository.addOtpByIdOrFail(userId, otp);
  }

  async clearOtpsById(userId: string) {
    return this.usersRepository.clearOtpsByIdOrFail(userId);
  }

  async verifyById(userId: string) {
    return this.usersRepository.verifyByIdOrFail(userId);
  }

  async updateById(userId: string, updateUserDto: UpdateUserDto) {
    return this.usersRepository.overwriteOneByIdOrFail(userId, updateUserDto);
  }

  async incrementTokenVersionById(userId: string) {
    return this.usersRepository.incrementTokenVersionByIdOrFail(userId);
  }
}
