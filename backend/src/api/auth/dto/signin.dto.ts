import {
  signInRequestSchema,
  signInResponseSchema,
  userZodSchema,
} from '@common/schemas';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const signInRequestZodSchema = z.discriminatedUnion('strategy', [
  z
    .object({
      strategy: z.literal('OTP'),
    })
    .merge(
      userZodSchema.pick({
        email: true,
      }),
    ),
  z
    .object({
      strategy: z.literal('PASSWORD'),
    })
    .merge(
      userZodSchema.pick({
        email: true,
        // TODO: password
      }),
    ),
]);

export class SignInRequestDto extends createZodDto(signInRequestSchema) {}

export class SignInResponseDto extends createZodDto(signInResponseSchema) {}
