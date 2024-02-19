import { TAddress, TOtp, TUser, UserRole } from '@common/schemas';
import { Address } from '@lib/common/address.schema';
import { BaseSchema, BaseSchemaOptions } from '@lib/common/base.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export class Otp extends Document implements TOtp {
  @Prop({ required: true })
  password: string;
  @Prop({ required: true })
  expiresAt: number;
}

@Schema(BaseSchemaOptions)
export class User extends BaseSchema implements TUser {
  @Prop({ required: true, type: Array<Otp>, default: [] })
  otps: TOtp[];

  @Prop({ required: true, type: Address })
  address: TAddress;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true, type: Array<string>, default: [UserRole.USER] })
  roles: UserRole[];

  @Prop({ required: true, default: false })
  verified: boolean;

  @Prop({ required: true, default: false })
  onboarded: boolean;

  @Prop({ required: true, default: false })
  blocked: boolean;

  @Prop({ required: true, default: 0 })
  tokenVersion: number;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
