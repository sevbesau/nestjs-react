import { z } from 'zod';

import { addressZodSchema, createAddressSchema } from './address';
import { isValidObjectId } from './lib';
import { PHONE_NUMBER_RE } from './lib/regex';
import { otpZodSchema } from './otp';

export enum UserRole {
  USER = 'USER',
  GOD = 'GOD',
}

export const userZodSchema = z.object({
  _id: isValidObjectId(),
  address: addressZodSchema,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().regex(PHONE_NUMBER_RE),
  roles: z.array(z.nativeEnum(UserRole).default(UserRole.USER)),
  verified: z.boolean().default(false),
  onboarded: z.boolean().default(false),
  blocked: z.boolean().default(false),
  otps: z.array(otpZodSchema),
  tokenVersion: z.number().default(0),
});

export type TUser = z.infer<typeof userZodSchema>;

export const createUserSchema = userZodSchema
  .pick({
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
  })
  .merge(
    z.object({
      address: createAddressSchema,
    }),
  );

/**
 * PATCH /user
 */
export const updateUserRequestSchema = userZodSchema
  .pick({
    firstName: true,
    lastName: true,
    phone: true,
    address: true,
  })
  .partial();

/**
 * PATCH /users 200
 */
export const sanitizedUserSchema = userZodSchema.pick({
  _id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  roles: true,
  onboarded: true,
  address: true,
});
