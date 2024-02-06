import { z } from 'zod';

import { createAddressSchema } from './address';
import { isValidObjectId } from './lib';
import { otpZodSchema } from './otp';
import { sanitizedUserSchema, UserRole, userZodSchema } from './users';

/*
 * POST /auth/otp
 */
export const validateOtpRequestSchema = otpZodSchema
  .pick({
    password: true,
  })
  .merge(
    z.object({
      userId: z.string(),
    }),
  );

/*
 * POST /auth/signin
 */
export const signInRequestSchema = userZodSchema.pick({ email: true });

/*
 * POST /auth/signin 200
 */
export const signInResponseSchema = z.object({ userId: isValidObjectId() });

/*
 * GET /auth 200
 */
export const signedInUserResponseSchema = sanitizedUserSchema;

export const allowedUserRolesOnSignUp = [UserRole.USER];

export const signUpRequestSchema = userZodSchema
  .pick({
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
  })
  .merge(
    z.object({
      address: createAddressSchema,
      roles: z
        .array(
          z
            .nativeEnum(UserRole)
            .refine((role) => allowedUserRolesOnSignUp.includes(role)),
        )
        .default([UserRole.USER]),
      captchaResponse: z.string(),
    }),
  );
